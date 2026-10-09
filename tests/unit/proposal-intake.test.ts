import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/plan/route";
import { deliverPlanRequest } from "@/lib/notify";
import { trackServer } from "@/lib/analytics";
import { sharedRateLimit } from "@/server/security/rate-limit";
import { emptyProposal, proposalAnswersSchema, proposalBrief, proposalFit, proposalRequestSchema, proposalStepReady, toggleProposalTool, type ProposalAnswers } from "@/lib/proposal-intake";

vi.mock("@/lib/notify", () => ({ deliverPlanRequest: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/lib/analytics", () => ({ trackServer: vi.fn(async () => {}) }));
vi.mock("@/server/security/rate-limit", () => ({ sharedRateLimit: vi.fn(() => ({ allowed: true })) }));

const answers: ProposalAnswers = {
  goals: ["More qualified leads", "Better sales follow-up"], customerType: "Businesses & property owners",
  teamSize: "21–50 people", teamModel: "In-house team + agency", revenue: "$2M–$5M",
  tools: ["HubSpot", "Jobber"], otherTools: "", setupBudget: "$15,000–$30,000",
  monthlyBudget: "$3,500–$7,500 / month", timeline: "Within 1–3 months", role: "Owner / final decision-maker",
};
const lead = { kind: "proposal", name: "Fictional Test", email: "test@example.invalid", company: "Fictional QA", website: "example.invalid", phone: "", qualification: answers, consent: true, source: "header", pagePath: "/industries/niches/commercial-roofing", landingPath: "/markets/florida/miami" };
const request = (body: unknown) => new NextRequest("http://localhost/api/plan", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

beforeEach(() => { vi.clearAllMocks(); vi.mocked(deliverPlanRequest).mockResolvedValue({ ok: true }); vi.mocked(sharedRateLimit).mockResolvedValue({ allowed: true, remaining: 4 }); });

describe("proposal qualification", () => {
  it("requires the choices before advancing and retains the full review brief", () => {
    for (let step = 0; step < 6; step++) {
      expect(proposalStepReady(step, emptyProposal())).toBe(false);
      expect(proposalStepReady(step, answers)).toBe(true);
    }
    const brief = proposalBrief(answers);
    for (const value of ["Jobber", "HubSpot", "$15,000–$30,000", "$3,500–$7,500 / month", "21–50 people", "In-house team + agency", "Within 1–3 months", "Owner / final decision-maker"]) expect(brief).toContain(value);
  });
  it("makes no-tools and not-sure choices exclusive, and rejects contradictory server input", () => {
    expect(toggleProposalTool(["HubSpot"], "Not sure")).toEqual(["Not sure"]);
    expect(toggleProposalTool(["No tools yet"], "Jobber")).toEqual(["Jobber"]);
    expect(toggleProposalTool(["HubSpot", "Jobber"], "HubSpot")).toEqual(["Jobber"]);
    expect(proposalAnswersSchema.safeParse({ ...answers, tools: ["Jobber", "Not sure"] }).success).toBe(false);
    expect(proposalAnswersSchema.safeParse({ ...answers, tools: ["HubSpot", "HubSpot"] }).success).toBe(false);
    expect(proposalAnswersSchema.parse({ ...answers, otherTools: "Stale input" }).otherTools).toBe("");
  });
  it("routes budgets deterministically without inventing scores or rejecting people", () => {
    expect(proposalFit(answers)).toBe("ready_for_review");
    expect(proposalFit({ ...answers, setupBudget: "Under $7,500" })).toBe("below_current_minimum");
    expect(proposalFit({ ...answers, monthlyBudget: "Under $2,500 / month" })).toBe("below_current_minimum");
    expect(proposalFit({ ...answers, setupBudget: "Need guidance" })).toBe("needs_scoping");
    expect(proposalRequestSchema.safeParse({ ...lead, qualification: { ...answers, setupBudget: "Under $7,500" } }).success).toBe(true);
  });
  it("requires consent, contact details, bounded choices and a recognized request type", async () => {
    for (const invalid of [
      { ...lead, consent: false }, { ...lead, company: "" }, { ...lead, email: "invalid" },
      { ...lead, qualification: { ...answers, setupBudget: "unlimited" } },
      { ...lead, qualification: { ...answers, goals: [] } },
      { ...lead, qualification: { ...answers, otherTools: "x".repeat(161) } },
      { ...lead, kind: "automatic-approval" },
    ]) expect((await POST(request(invalid))).status).toBe(400);
    expect(deliverPlanRequest).not.toHaveBeenCalled();
    expect(trackServer).not.toHaveBeenCalled();
  });
  it("delivers the full brief and only allowlisted page dimensions to analytics", async () => {
    expect((await POST(request(lead))).status).toBe(200);
    expect(deliverPlanRequest).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ kind: "proposal", company: "Fictional QA", goal: proposalBrief(answers), pagePath: "/industries/niches/commercial-roofing" }));
    expect(trackServer).toHaveBeenCalledExactlyOnceWith("proposal_received", expect.objectContaining({ niche: "commercial-roofing", landing_city: "miami", request_received: true }));
    expect(JSON.stringify(vi.mocked(trackServer).mock.calls)).not.toMatch(/Fictional|example.invalid|HubSpot|budget|revenue|qualified|ready_for_review/);
  });
  it("never reports success or analytics on delivery failure, exception or rate limiting", async () => {
    vi.mocked(deliverPlanRequest).mockResolvedValue({ ok: false });
    expect((await POST(request(lead))).status).toBe(502);
    vi.mocked(deliverPlanRequest).mockRejectedValue(new Error("private delivery detail"));
    const failed = await POST(request(lead));
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain("private");
    expect(trackServer).not.toHaveBeenCalled();
    vi.clearAllMocks();
    vi.mocked(sharedRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });
    expect((await POST(request(lead))).status).toBe(429);
    expect(deliverPlanRequest).not.toHaveBeenCalled();
  });
});
