export function platformCsp(nonce: string, development = false): string {
  return ["default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
    `connect-src 'self'${development ? " ws: wss:" : ""}`, "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"].join("; ");
}

export const commonSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Native form POSTs can be sent before hydration. Keep the Referer within
  // this origin so browsers can supply a non-null Origin to Next Server Actions;
  // do not disclose the path to other origins.
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Static marketing pages need Next's inline hydration. Authenticated pages
  // override this baseline with a per-request nonce in proxy.ts.
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
];
