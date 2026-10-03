import { describe, it, expect } from "vitest";
import { clientSafe, leaksRuntime, redactSecrets } from "@/server/redact";
import { CLIENT_ERROR_MESSAGES, RuntimeError, sanitizeRuntimeError } from "@/server/runtime/runtime-errors";
import { translateAction, translateEvent } from "@/server/runtime/translate";

describe("redaction and sanitization", () => {
  it("redacts credential-shaped strings", () => {
    const s = redactSecrets("Authorization: Bearer abcdefghijklmnop123 key sk-ant-abcdefghijklmnop AKIAABCDEFGHIJKLMNOP api_key=supersecretvalue");
    expect(s).not.toMatch(/abcdefghijklmnop123|sk-ant-abcdefghijk|AKIAABCDEFGHIJKLMNOP|supersecretvalue/);
  });
  it("client text never carries runtime vocabulary, hosts, ports or ARNs", () => {
    const s = clientSafe("Hermes Agent at acme-x1.runtime.agenticbots.dev:8642 failed; arn:aws:secretsmanager:us-east-1:1:secret:agenticbots/prod/tenants/acme/runtime i-0abc12345678def90 HERMES_HOME");
    expect(leaksRuntime(s)).toBe(false);
    expect(s).not.toMatch(/runtime\.agenticbots\.dev|arn:aws|i-0abc|8642/);
  });
  it("keeps line breaks in client previews", () => {
    expect(clientSafe("Subject: Hi\n\nBody line")).toContain("\n");
  });
  it("sanitizeRuntimeError returns a fixed client sentence and a redacted operator line", () => {
    const s = sanitizeRuntimeError(new Error("fetch failed: ECONNREFUSED 10.0.0.4:8642 token=abc123secretXYZ\n    at foo (/opt/hermes/x.py:1)"), "cor_1");
    expect(Object.values(CLIENT_ERROR_MESSAGES)).toContain(s.client);
    expect(s.client).toBe("Bot temporarily unavailable.");
    expect(s.operator).not.toMatch(/abc123secretXYZ|\/opt\/hermes/);
    expect(s.correlationId).toBe("cor_1");
    expect(sanitizeRuntimeError(new RuntimeError("integration_failure", "invalid_grant"), "c").client).toBe("Integration requires attention.");
    expect(sanitizeRuntimeError(new RuntimeError("approval_expired", "x"), "c").client).toBe("Approval expired.");
  });
  it("translates actions into business language", () => {
    expect(translateAction("web_search").client).toBe("Researching");
    expect(translateAction("browser_navigate").client).toBe("Reviewing source");
    expect(translateAction("mcp_hubspot_update_contact").client).toBe("Checking CRM");
    expect(translateAction("terminal").client).toBe("Processing data");
    expect(translateEvent({ type: "bot.run.completed", sourceEvent: "x", at: "" })?.clientText).toBe("Task complete");
    expect(translateEvent({ type: "bot.other", sourceEvent: "x", at: "" })).toBeNull();
  });
});
