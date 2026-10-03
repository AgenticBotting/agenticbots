#!/bin/bash
# AgenticBots runtime lifecycle — invoked ONLY through the SSM document
# AgenticBots-RuntimeLifecycle (or by bootstrap). Fixed actions; the
# arguments are validated by the document AND here.
#
#   lifecycle.sh <action> <profile|none>
set -euo pipefail
ACTION="${1:-status}"
PROFILE="${2:-none}"
source /opt/agenticbots/runtime.env
BUNDLE=/opt/agenticbots/runtime
SECRETS=/opt/agenticbots/secrets
COMPOSE="docker compose -f $BUNDLE/docker-compose.yml"
ENGINE_HOME="$AGB_DATA_DIR/engine"

[[ "$PROFILE" =~ ^[a-z0-9_-]{1,40}$ ]] || { echo "invalid profile"; exit 2; }
[[ "$ENGINE_IMAGE" =~ @sha256:[a-f0-9]{64}$ ]] || { echo "refusing: ENGINE_IMAGE is not pinned by digest"; exit 3; }
export ENGINE_IMAGE AGB_DATA_DIR

secret() { aws secretsmanager get-secret-value --region "$AWS_REGION" --secret-id "$SECRET_PREFIX/$1" --query SecretString --output text; }
put_secret() { aws secretsmanager put-secret-value --region "$AWS_REGION" --secret-id "$SECRET_PREFIX/$1" --secret-string "$2" >/dev/null; }
hermes() { docker exec -u hermes agb-hermes hermes "$@"; }

write_secrets() {
  # Engine + tunnel env files, rebuilt from Secrets Manager on every start.
  install -d -m 700 "$SECRETS"
  umask 077
  local rt prov
  rt="$(secret runtime)"
  prov="$(secret providers 2>/dev/null || echo '{}')"
  {
    echo "API_SERVER_KEY=$(echo "$rt" | jq -r '.defaultProfileKey')"
    echo "$prov" | jq -r 'to_entries[] | "\(.key)=\(.value)"'
  } > "$SECRETS/engine.env"
  echo "TUNNEL_TOKEN=$(echo "$rt" | jq -r '.tunnelToken')" > "$SECRETS/tunnel.env"
}

ensure_profile() {
  local p="$1"
  local dir="$ENGINE_HOME/profiles/$p"
  if [ ! -d "$dir" ]; then hermes profile create "$p" --description "AgenticBots $p Bot"; fi
  # Each profile gets its OWN key — never shared across profiles or clients.
  local key
  key="$(secret "profiles/$p" 2>/dev/null | jq -r '.apiKey // empty' || true)"
  if [ -z "$key" ]; then
    key="$(openssl rand -hex 32)"
    put_secret "profiles/$p" "$(jq -nc --arg k "$key" '{apiKey:$k}')"
  fi
  umask 077
  touch "$dir/.env"
  grep -v '^API_SERVER_KEY=' "$dir/.env" > "$dir/.env.tmp" || true
  echo "API_SERVER_KEY=$key" >> "$dir/.env.tmp"
  mv "$dir/.env.tmp" "$dir/.env"
  # Base config (least capability, approvals) + AgenticBots skills for this Bot.
  python3 - "$dir/config.yaml" "$BUNDLE/config/profile-config.yaml" <<'PY'
import sys, yaml, os
dst, base = sys.argv[1], sys.argv[2]
cur = yaml.safe_load(open(dst)) if os.path.exists(dst) else {}
cur = cur or {}
def merge(a, b):
    # Base settings win (least capability + approvals are not optional);
    # anything else already in the profile (e.g. mcp_servers) is kept.
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(a.get(k), dict):
            merge(a[k], v)
        else:
            a[k] = v
merge(cur, yaml.safe_load(open(base)) or {})
yaml.safe_dump(cur, open(dst, "w"), sort_keys=False)
PY
  mkdir -p "$dir/skills"
  if [ -f "$BUNDLE/skills/$p.list" ]; then
    while read -r s; do [ -n "$s" ] && rsync -a --delete "$BUNDLE/skills/$s/" "$dir/skills/$s/"; done < "$BUNDLE/skills/$p.list"
  fi
  chown -R 10000:10000 "$dir"
}

case "$ACTION" in
  bootstrap)
    write_secrets
    mkdir -p "$ENGINE_HOME"; chown -R 10000:10000 "$ENGINE_HOME"
    $COMPOSE pull
    $COMPOSE up -d
    sleep 20
    for p in $BOT_PROFILES; do ensure_profile "$p"; done
    hermes gateway restart || $COMPOSE restart hermes
    ;;
  status)
    $COMPOSE ps --format json || true
    df -h "$AGB_DATA_DIR" | tail -1
    ;;
  start-runtime)
    write_secrets
    $COMPOSE up -d
    ;;
  stop-runtime)
    # Suspension: stop execution; the data volume is untouched.
    $COMPOSE stop
    ;;
  restart-runtime)
    write_secrets
    $COMPOSE restart
    ;;
  park-bot)
    # Engine-native per-profile stop: writes gateway.parked, keeps everything.
    hermes -p "$PROFILE" gateway stop || touch "$ENGINE_HOME/profiles/$PROFILE/gateway.parked"
    ;;
  unpark-bot)
    hermes -p "$PROFILE" gateway start || rm -f "$ENGINE_HOME/profiles/$PROFILE/gateway.parked"
    ;;
  deploy-bot)
    ensure_profile "$PROFILE"
    hermes -p "$PROFILE" gateway restart || true
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
