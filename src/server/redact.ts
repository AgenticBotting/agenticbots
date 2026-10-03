import "server-only";

/**
 * Redaction. Two levels:
 *
 *   redactSecrets()  — always. Strips anything shaped like a credential
 *                      before it is stored, logged or shown to anyone.
 *   clientSafe()     — for client-facing text. Also removes runtime
 *                      vocabulary, private hostnames, ports and cloud
 *                      identifiers, so nothing technical reaches a client
 *                      even if a Bot quotes it.
 */
const SECRET_PATTERNS: [RegExp, string][] = [
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, "$1 [redacted]"],
  [/\b(sk|pk|rk|sess|ghp|gho|xox[abpr]|glpat)[-_][A-Za-z0-9_-]{10,}/g, "[redacted-key]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[redacted-aws-key]"],
  [/\b(api[_-]?key|secret|token|password|passwd|authorization|refresh[_-]?token|client[_-]?secret)\b(\s*[:=]\s*)("?)[^\s"',;]{4,}\3/gi, "$1$2[redacted]"],
  [/https?:\/\/[^\s/:@]+:[^\s/@]+@/g, "https://[redacted]@"],
  [/\b[A-Fa-f0-9]{40,}\b/g, "[redacted-hex]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g, "[redacted-jwt]"],
];

export function redactSecrets(input: string | undefined | null, maxLen = 2000): string {
  if (!input) return "";
  let s = String(input);
  for (const [re, rep] of SECRET_PATTERNS) s = s.replace(re, rep);
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

/** Vocabulary that must never appear in client-facing text. Kept in one
 *  place and shared with the white-label test. */
export const CLIENT_FORBIDDEN_TERMS = [
  "hermes",
  "nousresearch",
  "nous research",
  "hermes-agent",
  "8642",
  "HERMES_HOME",
  "API_SERVER_KEY",
] as const;

const CLIENT_PATTERNS: [RegExp, string][] = [
  [/hermes[-_ ]?agent/gi, "the runtime"],
  [/nous\s*research|nousresearch/gi, "the runtime"],
  [/\bhermes\b/gi, "the runtime"],
  [/\b[a-z0-9-]+\.runtime\.agenticbots\.dev\b/gi, "[internal]"],
  [/\b(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\b/gi, "[internal]"],
  [/:\d{4,5}\b/g, ""],
  [/\b8642\b/g, ""],
  [/\barn:aws:[^\s"']+/gi, "[internal]"],
  [/\b(i|vol|snap|sg|subnet|vpc)-[0-9a-f]{8,17}\b/gi, "[internal]"],
  [/\bagenticbots\/(prod|staging|demo)\/tenants\/[^\s"']+/gi, "[internal]"],
  [/\b(HERMES_[A-Z_]+|API_SERVER_[A-Z_]+)\b/g, "[internal]"],
  [/\/opt\/(data|hermes|agenticbots)[^\s"']*/gi, "[internal]"],
  [/\bmcp[_ -]?(server|servers)?\b/gi, "connection"],
];

export function clientSafe(input: string | undefined | null, maxLen = 600): string {
  let s = redactSecrets(input, maxLen * 2);
  for (const [re, rep] of CLIENT_PATTERNS) s = s.replace(re, rep);
  s = s.replace(/[ \t]{2,}/g, " ").trim();
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

/** True when a string would leak runtime vocabulary to a client. */
export function leaksRuntime(s: string): boolean {
  const lower = s.toLowerCase();
  return CLIENT_FORBIDDEN_TERMS.some((t) => lower.includes(t.toLowerCase()));
}
