#!/bin/bash
# AgenticBots runtime lifecycle — invoked ONLY through the SSM document
# AgenticBots-RuntimeLifecycle-<env> (or by first-boot bootstrap). Fixed
# actions; the arguments are validated by the document AND here.
#
#   lifecycle.sh <action> <profile|none>
set -euo pipefail
ACTION="${1:-status}"
PROFILE="${2:-none}"
# shellcheck disable=SC1091
source /opt/agenticbots/runtime.env
BUNDLE=/opt/agenticbots/runtime
SECRETS=/opt/agenticbots/secrets
COMPOSE="docker compose -f $BUNDLE/docker-compose.yml"
ENGINE_HOME="$AGB_DATA_DIR/engine"
CONTAINER=agb-hermes

[[ "$PROFILE" =~ ^[a-z0-9_-]{1,40}$ ]] || { echo "invalid profile"; exit 2; }
[[ "$ENGINE_IMAGE" =~ @sha256:[a-f0-9]{64}$ ]] || { echo "refusing: ENGINE_IMAGE is not pinned by digest"; exit 3; }
export ENGINE_IMAGE AGB_DATA_DIR

log() { echo "[lifecycle $(date -u +%H:%M:%S)] $*"; }
secret() { aws secretsmanager get-secret-value --region "$AWS_REGION" --secret-id "$SECRET_PREFIX/$1" --query SecretString --output text; }
put_secret() { aws secretsmanager put-secret-value --region "$AWS_REGION" --secret-id "$SECRET_PREFIX/$1" --secret-string "$2" >/dev/null; }
# `docker exec` as root goes through the image's privilege-drop shim, so
# files the CLI writes stay owned by the engine user.
engine() { docker exec "$CONTAINER" hermes "$@"; }

# Merge a YAML file into another. Values from the overlay win (least
# capability + approvals are not optional); everything else is kept.
merge_yaml() {
  python3 - "$1" "$2" <<'PY'
import sys, yaml, os
dst, overlay = sys.argv[1], sys.argv[2]
cur = (yaml.safe_load(open(dst)) if os.path.exists(dst) else {}) or {}
def merge(a, b):
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(a.get(k), dict):
            merge(a[k], v)
        else:
            a[k] = v
merge(cur, yaml.safe_load(open(overlay)) or {})
yaml.safe_dump(cur, open(dst, "w"), sort_keys=False)
PY
}

model_overlay() {
  # Default model for the engine (readiness reports "degraded" without one).
  local f; f="$(mktemp)"
  printf 'model:\n  provider: "%s"\n  default: "%s"\n' "${DEFAULT_MODEL_PROVIDER:-openrouter}" "${DEFAULT_MODEL:?DEFAULT_MODEL missing from runtime.env}" > "$f"
  echo "$f"
}

wait_for_runtime_secret() {
  # The control plane stores the endpoint, tunnel token and default key right
  # after Terraform creates the secret. On first boot we may get here first.
  local i
  for i in $(seq 1 120); do
    if secret runtime 2>/dev/null | jq -e '.tunnelToken and .defaultProfileKey' >/dev/null 2>&1; then return 0; fi
    log "waiting for $SECRET_PREFIX/runtime to be filled in ($i/120)"
    sleep 10
  done
  log "runtime secret never arrived"; exit 4
}

write_secrets() {
  # Engine + tunnel env files, rebuilt from Secrets Manager on every start.
  install -d -m 700 "$SECRETS"
  umask 077
  local rt prov
  rt="$(secret runtime)"
  prov="$(secret providers 2>/dev/null || echo '{}')"
  {
    echo "API_SERVER_KEY=$(echo "$rt" | jq -r '.defaultProfileKey')"
    echo "$prov" | jq -r 'to_entries[] | select(.key | test("^[A-Z][A-Z0-9_]{1,63}$")) | "\(.key)=\(.value)"'
  } > "$SECRETS/engine.env"
  echo "TUNNEL_TOKEN=$(echo "$rt" | jq -r '.tunnelToken')" > "$SECRETS/tunnel.env"
}

configure_root() {
  mkdir -p "$ENGINE_HOME"
  local m; m="$(model_overlay)"
  merge_yaml "$ENGINE_HOME/config.yaml" "$BUNDLE/config/root-config.yaml"
  merge_yaml "$ENGINE_HOME/config.yaml" "$m"
  rm -f "$m"
  chown -R 10000:10000 "$ENGINE_HOME"
}

wait_healthy() {
  local i st
  for i in $(seq 1 60); do
    st="$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo missing)"
    [ "$st" = healthy ] && { log "engine healthy"; return 0; }
    sleep 5
  done
  log "engine did not become healthy (last: $st)"; docker logs --tail 80 "$CONTAINER" || true; exit 5
}

ensure_profile() {
  local p="$1"
  local dir="$ENGINE_HOME/profiles/$p"
  if [ ! -d "$dir" ]; then engine profile create "$p" --no-alias --description "AgenticBots $p Bot"; fi
  # Each profile gets its OWN key — never shared across profiles or clients.
  local key
  key="$(secret "profiles/$p" 2>/dev/null | jq -r '.apiKey // empty' || true)"
  if [ -z "$key" ]; then
    key="$(openssl rand -hex 32)"
    put_secret "profiles/$p" "$(jq -nc --arg k "$key" '{apiKey:$k}')"
  fi
  umask 077
  touch "$dir/.env"
  # Profile env = its own API key + the model provider keys.
  grep -v -E '^(API_SERVER_KEY)=' "$dir/.env" > "$dir/.env.tmp" || true
  grep -v '^API_SERVER_KEY=' "$SECRETS/engine.env" | while IFS= read -r line; do
    k="${line%%=*}"; grep -v "^$k=" "$dir/.env.tmp" > "$dir/.env.tmp2" || true; mv "$dir/.env.tmp2" "$dir/.env.tmp"
  done
  grep -v '^API_SERVER_KEY=' "$SECRETS/engine.env" >> "$dir/.env.tmp" || true
  echo "API_SERVER_KEY=$key" >> "$dir/.env.tmp"
  mv "$dir/.env.tmp" "$dir/.env"
  # Base config (least capability, approvals, default model) + AgenticBots skills.
  local m; m="$(model_overlay)"
  merge_yaml "$dir/config.yaml" "$BUNDLE/config/profile-config.yaml"
  merge_yaml "$dir/config.yaml" "$m"
  rm -f "$m"
  mkdir -p "$dir/skills"
  if [ -f "$BUNDLE/skills/$p.list" ]; then
    while read -r s; do [ -n "$s" ] && rsync -a --delete "$BUNDLE/skills/$s/" "$dir/skills/$s/"; done < "$BUNDLE/skills/$p.list"
  fi
  chown -R 10000:10000 "$dir"
}

# Re-apply keys, config and skills to every Bot profile on the volume
# (e.g. after a provider key rotation).
refresh_profiles() {
  local d
  for d in "$ENGINE_HOME"/profiles/*/; do
    [ -d "$d" ] && ensure_profile "$(basename "$d")"
  done
  return 0
}

case "$ACTION" in
  bootstrap)
    wait_for_runtime_secret
    write_secrets
    configure_root
    $COMPOSE pull
    $COMPOSE up -d hermes
    wait_healthy
    for p in $BOT_PROFILES; do ensure_profile "$p"; done
    # Restart so the host gateway serves every profile (and their keys),
    # then start the tunnel once the engine is healthy.
    $COMPOSE restart hermes
    wait_healthy
    $COMPOSE up -d
    ;;
  status)
    echo "image: $ENGINE_IMAGE"
    $COMPOSE ps --format json || true
    df -h "$AGB_DATA_DIR" | tail -1
    ;;
  start-runtime)
    write_secrets
    configure_root
    $COMPOSE up -d hermes
    wait_healthy
    refresh_profiles
    $COMPOSE restart hermes
    wait_healthy
    $COMPOSE up -d
    ;;
  stop-runtime)
    # Suspension: stop execution; the data volume is untouched.
    $COMPOSE stop
    ;;
  restart-runtime)
    write_secrets
    configure_root
    $COMPOSE up -d hermes
    wait_healthy
    refresh_profiles
    $COMPOSE restart
    wait_healthy
    ;;
  park-bot)
    # Engine-native per-profile stop: writes gateway.parked, keeps everything.
    engine -p "$PROFILE" gateway stop || touch "$ENGINE_HOME/profiles/$PROFILE/gateway.parked"
    ;;
  unpark-bot)
    engine -p "$PROFILE" gateway start || rm -f "$ENGINE_HOME/profiles/$PROFILE/gateway.parked"
    ;;
  deploy-bot)
    write_secrets
    ensure_profile "$PROFILE"
    rm -f "$ENGINE_HOME/profiles/$PROFILE/gateway.parked"
    # Ask the running host gateway to pick the profile up (attach exits once
    # it is served). If that does not work, restart the engine container.
    if ! timeout 90 docker exec "$CONTAINER" hermes -p "$PROFILE" gateway run; then
      log "attach did not confirm; restarting the engine"
      $COMPOSE restart hermes
      wait_healthy
    fi
    ;;
  backup-now)
    VOL=$(lsblk -no SERIAL "$(findmnt -no SOURCE "$AGB_DATA_DIR")" | sed 's/^vol/vol-/')
    aws ec2 create-snapshot --region "$AWS_REGION" --volume-id "$VOL" --description "agenticbots manual $TENANT_ID" \
      --tag-specifications "ResourceType=snapshot,Tags=[{Key=agenticbots:tenant,Value=$TENANT_ID},{Key=agenticbots:snapshot,Value=manual}]"
    ;;
  *)
    echo "unknown action"; exit 2 ;;
esac
echo "ok: $ACTION $PROFILE"
