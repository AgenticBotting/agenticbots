import { afterEach, describe, expect, it, vi } from "vitest";

const request = { kind: "proposal" as const, name: "Fictional <script>QA</script>", email: "test@example.invalid", company: "Fictional QA", goal: "Setup budget: $15,000–$30,000\nCurrent tools: HubSpot & Jobber" };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe("proposal delivery boundary", () => {
  it("has zero external effects in demo mode", async () => {
    vi.stubEnv("DEMO_MODE", "true"); vi.stubEnv("RESEND_API_KEY", "fictional-test-key");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const { deliverPlanRequest } = await import("@/lib/notify");
    await expect(deliverPlanRequest(request)).rejects.toThrow("demo");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("fails closed without an inbox even if a subscriber sink exists", async () => {
    vi.stubEnv("DEMO_MODE", "false"); vi.stubEnv("RESEND_API_KEY", ""); vi.stubEnv("MAILERLITE_API_KEY", "fictional-list-key");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const { deliverPlanRequest } = await import("@/lib/notify");
    expect(await deliverPlanRequest(request)).toEqual({ ok: false });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("delivers only to the configured inbox with escaped complete answers, never auto-subscribes", async () => {
    vi.stubEnv("DEMO_MODE", "false"); vi.stubEnv("RESEND_API_KEY", "fictional-test-key"); vi.stubEnv("MAILERLITE_API_KEY", "fictional-list-key");
    const fetch = vi.fn(async () => ({ ok: true })); vi.stubGlobal("fetch", fetch);
    const { deliverPlanRequest } = await import("@/lib/notify");
    expect(await deliverPlanRequest(request)).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (fetch.mock.calls as unknown as [string, { body: string }][])[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(options.body);
    expect(body.html).toContain("&lt;script&gt;QA&lt;/script&gt;");
    expect(body.html).not.toContain("<script>");
    expect(body.html).toContain("Setup budget: $15,000–$30,000");
    expect(body.html).toContain("HubSpot &amp; Jobber");
  });
  it("does not treat a rejected inbox delivery as success", async () => {
    vi.stubEnv("DEMO_MODE", "false"); vi.stubEnv("RESEND_API_KEY", "fictional-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
    const { deliverPlanRequest } = await import("@/lib/notify");
    expect(await deliverPlanRequest(request)).toEqual({ ok: false });
  });
});
