import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/plan/route";
import { deliverPlanRequest } from "@/lib/notify";
import { trackServer } from "@/lib/analytics";
import { checkRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/notify", () => ({ deliverPlanRequest: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/lib/analytics", () => ({ trackServer: vi.fn(async () => {}) }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true })) }));

const request = (body: unknown) => new NextRequest("http://localhost/api/plan", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const lead = { name: "Fictional Test", email: "test@example.invalid", focus: "private free text", source: "private-source-text", goal: "private goal", pagePath: "/industries/roofing/seo", landingPath: "/markets/florida/miami" };

beforeEach(() => { vi.clearAllMocks(); vi.mocked(deliverPlanRequest).mockResolvedValue({ ok: true }); vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 4 }); });

describe("audit request attribution", () => {
  it("records one request event after mocked delivery with only allowed route dimensions", async () => {
    const response = await POST(request(lead));
    expect(response.status).toBe(200);
    expect(deliverPlanRequest).toHaveBeenCalledTimes(1);
    expect(trackServer).toHaveBeenCalledExactlyOnceWith("plan_form_submitted", { page: "/industries/roofing/seo", page_family: "industries", industry: "roofing", service: "seo", landing_page: "/markets/florida/miami", landing_page_family: "markets", landing_state: "florida", landing_city: "miami", request_received: true });
    expect(JSON.stringify(vi.mocked(trackServer).mock.calls)).not.toMatch(/private|Fictional|example.invalid|converted|paid/);
  });
  it("does not record a request when delivery fails", async () => {
    vi.mocked(deliverPlanRequest).mockResolvedValue({ ok: false });
    expect((await POST(request(lead))).status).toBe(502);
    expect(trackServer).not.toHaveBeenCalled();
  });
  it("rejects malformed input before delivery or analytics", async () => {
    for (const body of [null, [], {}, { ...lead, email: "invalid" }]) expect((await POST(request(body))).status).toBe(400);
    expect(deliverPlanRequest).not.toHaveBeenCalled();
    expect(trackServer).not.toHaveBeenCalled();
  });
  it("retains the intake rate limit", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, remaining: 0 });
    expect((await POST(request(lead))).status).toBe(429);
    expect(deliverPlanRequest).not.toHaveBeenCalled();
  });
});
