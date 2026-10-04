import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { prospectWorld, acmeMarket, demoSet, addBot, NOW, BROWARD, FakePaid } from "./helpers";
import { asUser, allowed } from "@/server/prospecting/access";
import { createIcp, createMarket, listMarkets, marketCoverage } from "@/server/prospecting/markets";
import { enqueueJob, runJob } from "@/server/prospecting/jobs";
import { listProspects, qualifyProspect, saveProspect } from "@/server/prospecting/prospects";
import { addSuppression, checkSuppression, liftSuppression } from "@/server/prospecting/compliance";
import { sendToOutbound } from "@/server/prospecting/outbound";
import { clientProspects } from "@/server/prospecting/views";
import { botPrincipal, issueToolToken, runProspectingTool, verifyToolToken, TOOL_NAMES } from "@/server/prospecting/tools";
import { PRIVATE_PROSPECT_TABLES, SHARED_PROSPECT_TABLES, PROSPECT_TABLE_NAMES } from "@/lib/prospecting/types";
import { PLATFORM_TABLES, APPEND_ONLY } from "@convex/platformTables";
import { APPEND_ONLY_TABLES, TABLE_NAMES } from "@/lib/platform/types";
import { CLIENT_FORBIDDEN_TERMS } from "@/server/redact";
import { Tx } from "@/server/db/repository";
import type { ProviderSet } from "@/server/prospecting/providers/types";

async function discovered() {
  const pw = await prospectWorld();
  const m = await acmeMarket(pw);
  const j = await enqueueJob(pw.ops, pw.acme.id, "DISCOVER_MARKET", { marketId: m.id });
  await runJob(pw.r, j.id, { now: NOW, providers: demoSet() });
  const prospects = await listProspects(pw.ops, pw.acme.id, { marketId: m.id });
  return { pw, m, prospects };
}

const VENDORS = ["rocketreach", "leadmagic", "hunter", "prospeo", "lemlist"];

describe("tenant isolation", () => {
  it("a client sees only its own prospects; other tenants get not-found", async () => {
    const { pw, m, prospects } = await discovered();
    const owner = pw.ctx(asUser(pw.owner));
    expect((await listProspects(owner, pw.acme.id)).length).toBe(prospects.length);
    // Bayside cannot be read by Acme's owner, and Acme's market is invisible to anyone outside it.
    await expect(listProspects(owner, pw.bayside.id)).rejects.toMatchObject({ status: 404 });
    const baysideM = await createMarket(pw.ops, pw.bayside.id, { nicheId: pw.roofing.id, geography: BROWARD });
    await expect(marketCoverage(owner, baysideM.id)).rejects.toMatchObject({ status: 404 });
    // Client users are read-only.
    await expect(createMarket(owner, pw.acme.id, { nicheId: pw.roofing.id, geography: BROWARD })).rejects.toThrow();
    await expect(enqueueJob(owner, pw.acme.id, "DISCOVER_MARKET", { marketId: m.id })).rejects.toThrow();
  });

  it("an operator scoped to some clients cannot reach the others", async () => {
    const { pw, m } = await discovered();
    const scoped = { ...pw.operator, user: { ...pw.operator.user, operatorOrgIds: [pw.bayside.id] } };
    const ctx = pw.ctx(asUser(scoped));
    await expect(marketCoverage(ctx, m.id)).rejects.toMatchObject({ status: 404 });
    expect((await listMarkets(ctx)).map((x) => x.id)).not.toContain(m.id);
  });

  it("shared tables carry no orgId; private tables always do", async () => {
    const { pw } = await discovered();
    await createIcp(pw.ops, pw.acme.id, { name: "Private ICP", nicheIds: [pw.roofing.id], geographies: [BROWARD], notes: "secret strategy" });
    for (const t of SHARED_PROSPECT_TABLES) for (const row of await pw.ops.store.list(t)) expect((row as { orgId?: string }).orgId, t).toBeUndefined();
    for (const t of PRIVATE_PROSPECT_TABLES) for (const row of await pw.ops.store.list(t)) expect((row as { orgId?: string }).orgId, t).toBeTruthy();
    // Private ICP notes never land in shared records.
    const shared = JSON.stringify(await Promise.all(SHARED_PROSPECT_TABLES.map((t) => pw.ops.store.list(t))));
    expect(shared).not.toContain("secret strategy");
  });

  it("the same company in two clients' markets yields separate, private prospects", async () => {
    const { pw, prospects } = await discovered();
    const bm = await createMarket(pw.ops, pw.bayside.id, { nicheId: pw.roofing.id, geography: BROWARD });
    const company = prospects[0].companyId;
    const bp = await saveProspect(pw.ops, bm.id, company, { notes: "bayside private note" });
    expect(bp.orgId).toBe(pw.bayside.id);
    const acmeView = JSON.stringify(await clientProspects(pw.r, pw.owner, pw.acme.id));
    expect(acmeView).not.toContain("bayside private note");
    expect(acmeView).not.toContain(bm.id);
  });
});

describe("client view (white-label)", () => {
  it("never shows vendor names, provenance, costs or runtime names", async () => {
    const { pw } = await discovered();
    const rows = await clientProspects(pw.r, pw.owner, pw.acme.id);
    expect(rows.length).toBeGreaterThan(0);
    const blob = JSON.stringify(rows).toLowerCase();
    for (const t of [...VENDORS, ...CLIENT_FORBIDDEN_TERMS.map((x) => x.toLowerCase()), "provenance", "costusd", "provider"]) expect(blob, t).not.toContain(t);
  });
});

describe("suppression and outbound policy", () => {
  it("hard suppression blocks outbound for a Bot and a person; Bots cannot override", async () => {
    const { pw, prospects } = await discovered();
    const target = prospects.find((p) => p.status === "qualified")!;
    const cp = (await pw.ops.store.get("pg_contact_points", target.primaryContactPointId!))!;
    await addSuppression(pw.ops, { orgId: pw.acme.id, kind: "email", value: cp.value.toUpperCase(), reason: "do_not_contact" });
    const bot = pw.ctx({ kind: "bot", botId: pw.acmeBot.id, orgId: pw.acme.id, name: "Prospecting Bot" });
    const viaBot = await sendToOutbound(bot, target.id, { overrideSoft: true, providers: demoSet() });
    expect(viaBot.sent).toBe(false);
    expect(viaBot.handoff.status).toBe("rejected_policy");
    const viaPerson = await sendToOutbound(pw.ops, target.id, { overrideSoft: true, providers: demoSet() });
    expect(viaPerson.sent).toBe(false);
    // Through the Bot tool, extra arguments are rejected/ignored too.
    const res = (await runProspectingTool(bot, "sendToOutbound", { prospectId: target.id }, { providers: demoSet() })) as { sent: boolean };
    expect(res.sent).toBe(false);
    await expect(runProspectingTool(bot, "sendToOutbound", { prospectId: target.id, overrideSoft: true }, { providers: demoSet() })).resolves.toMatchObject({ sent: false });
  });

  it("soft suppression can be overridden by a person only", async () => {
    const { pw, prospects } = await discovered();
    const target = prospects.find((p) => p.status === "qualified")!;
    const company = (await pw.ops.store.get("pg_companies", target.companyId))!;
    await addSuppression(pw.ops, { orgId: pw.acme.id, kind: "domain", value: company.domain!, reason: "client_suppression", hard: false });
    const bot = pw.ctx({ kind: "bot", botId: pw.acmeBot.id, orgId: pw.acme.id, name: "Prospecting Bot" });
    expect((await sendToOutbound(bot, target.id, { overrideSoft: true, providers: demoSet() })).sent).toBe(false);
    expect((await sendToOutbound(pw.ops, target.id, { overrideSoft: true, providers: demoSet() })).sent).toBe(true);
  });

  it("global suppression applies to every client and needs a superadmin", async () => {
    const { pw } = await discovered();
    await expect(addSuppression(pw.ops, { kind: "domain", value: "blocked.example", reason: "global_suppression" })).rejects.toThrow();
    const g = await addSuppression(pw.admin, { kind: "domain", value: "blocked.example", reason: "global_suppression" });
    expect(await checkSuppression(pw.ops.store, pw.bayside.id, { email: "x@sub.blocked.example" })).toHaveLength(1);
    // A client suppression does not leak to another client.
    await addSuppression(pw.ops, { orgId: pw.acme.id, kind: "email", value: "only@acme.example", reason: "do_not_contact" });
    expect(await checkSuppression(pw.ops.store, pw.bayside.id, { email: "only@acme.example" })).toHaveLength(0);
    await expect(liftSuppression(pw.ops, g.id)).rejects.toThrow();
    const unsub = await addSuppression(pw.ops, { orgId: pw.acme.id, kind: "email", value: "gone@x.example", reason: "unsubscribed" });
    await expect(liftSuppression(pw.admin, unsub.id)).rejects.toThrow(/cannot be lifted/i);
  });

  it("only qualified prospects with a usable email go out; demo contacts never reach a live system", async () => {
    const { pw, prospects } = await discovered();
    const review = prospects.find((p) => p.status === "review" || p.status === "rejected");
    if (review) expect((await sendToOutbound(pw.ops, review.id, { providers: demoSet() })).violations.join(" ")).toMatch(/not qualified/);
    const q = prospects.find((p) => p.status === "qualified")!;
    const live = new FakePaid("live-outbound");
    const liveOnly: ProviderSet = { ...demoSet(), outbound: [live] };
    const blocked = await sendToOutbound(pw.ops, q.id, { providers: liveOnly });
    expect(blocked.violations.join(" ")).toMatch(/Demo contacts/);
    expect(live.calls).toBe(0);
  });

  it("outbound contract: vendor-neutral payload, idempotent, daily cap", async () => {
    const { pw, prospects } = await discovered();
    const qs = prospects.filter((p) => p.status === "qualified");
    const set = demoSet();
    const first = await sendToOutbound(pw.ops, qs[0].id, { providers: set, sequenceKey: "roof-pm" });
    expect(first.sent).toBe(true);
    expect(Object.keys(first.handoff.payload).sort()).toEqual(["company", "contact", "marketName", "reasons", "sequenceKey"]);
    expect(first.handoff.payload.contact.email).toMatch(/@.+\.example$/);
    const again = await sendToOutbound(pw.ops, qs[0].id, { providers: set });
    expect(again.handoff.id).toBe(first.handoff.id);
    expect((await pw.ops.store.get("pg_prospects", qs[0].id))?.status).toBe("sent_to_outbound");
    const { setBudget } = await import("@/server/prospecting/costs");
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 0, maxLeadsExportedPerRun: 1 });
    if (qs[1]) expect((await sendToOutbound(pw.ops, qs[1].id, { providers: set })).violations.join(" ")).toMatch(/Daily handoff cap/);
  });

  it("suspended clients cannot send", async () => {
    const { pw, prospects } = await discovered();
    const tx = new Tx(pw.r);
    tx.patch("organizations", pw.acme, { status: "suspended" });
    await tx.commit();
    await expect(sendToOutbound(pw.ops, prospects[0].id, { providers: demoSet() })).rejects.toThrow();
  });
});

describe("scoring and qualification", () => {
  it("scores are deterministic for the same asOf and never invent evidence", async () => {
    const { pw, prospects } = await discovered();
    const { loadScoreInput } = await import("@/server/prospecting/prospects");
    const { scoreProspect } = await import("@/server/prospecting/scoring");
    const p = prospects[0];
    const a = scoreProspect(await loadScoreInput(pw.ops.store, p, NOW));
    const b = scoreProspect(await loadScoreInput(pw.ops.store, p, NOW));
    expect(a).toEqual(b);
    for (const c of [...a.fitComponents, ...a.timingComponents]) if (!c.observed) expect(c.points).toBe(0);
    expect(a.priority).toBe(Math.round(0.6 * a.fit + 0.3 * a.timing + 0.1 * pw.roofing.attractiveness.total));
    // A prospect without signals has timing 0 with an explicit "no observed signal".
    const none = prospects.find((x) => x.score?.timing === 0);
    if (none) expect(none.score!.timingComponents[0].evidence).toMatch(/No observed timing signal/);
  });

  it("a Bot applies the rules but cannot override them; a person can, with a reason", async () => {
    const { pw, prospects } = await discovered();
    const p = prospects.find((x) => x.status === "review") ?? prospects[0];
    const bot = pw.ctx({ kind: "bot", botId: pw.acmeBot.id, orgId: pw.acme.id, name: "Prospecting Bot" });
    await expect(qualifyProspect(bot, p.id, { decision: "qualified", reason: "please" })).rejects.toThrow();
    const done = await qualifyProspect(pw.ops, p.id, { decision: "qualified", reason: "Spoke to them at a trade show" });
    expect(done.qualification).toMatchObject({ decision: "qualified", decidedBy: pw.operator.user.name });
    // Rules never undo a person's decision.
    expect((await qualifyProspect(bot, p.id)).status).toBe("qualified");
  });

  it("market coverage reports observed counts and no invented universe size", async () => {
    const { pw, m } = await discovered();
    const cov = await marketCoverage(pw.ops, m.id);
    expect(cov.observed.companies).toBeGreaterThan(0);
    expect(cov.estimate).toBeUndefined();
    const { setUniverseEstimate } = await import("@/server/prospecting/markets");
    await expect(setUniverseEstimate(pw.ops, m.id, 500, "guess")).rejects.toThrow(/Describe/);
    await setUniverseEstimate(pw.ops, m.id, 500, "County parcel records: commercial parcels over 20k sq ft, de-duplicated by owner.");
    expect((await marketCoverage(pw.ops, m.id)).estimate?.count).toBe(500);
  });

  it("market creation validates geography and niche", async () => {
    const pw = await prospectWorld();
    await expect(createMarket(pw.ops, pw.acme.id, { nicheId: pw.roofing.id, geography: { kind: "county", name: "X", state: "ZZ" } })).rejects.toThrow(/state/);
    await expect(createMarket(pw.ops, pw.acme.id, { nicheId: "nope", geography: BROWARD })).rejects.toThrow(/niche/i);
    const m = await createMarket(pw.ops, pw.acme.id, { nicheId: pw.roofing.id, geography: { ...BROWARD, state: "fl" } });
    expect(m.geography.state).toBe("FL");
    expect(m.buyerTypeIds.length).toBeGreaterThan(0);
  });
});

describe("Prospecting Bot tools", () => {
  it("exposes the full tool set", () => {
    expect(TOOL_NAMES.sort()).toEqual([
      "classifyBuyerType", "discoverCompanies", "findDecisionMakers", "findWorkEmail", "getCompanySignals", "getMarketCoverage",
      "qualifyProspect", "rejectProspect", "researchCompany", "saveProspect", "scoreCompany", "scoreProspect", "searchMarkets",
      "sendToCRM", "sendToOutbound", "verifyWorkEmail",
    ]);
  });

  it("a Bot is bound to its own client, and only a Prospecting Bot qualifies", async () => {
    const { pw, m } = await discovered();
    const principal = await botPrincipal(pw.r, pw.acmeBot.id, pw.acme.id);
    await expect(botPrincipal(pw.r, pw.acmeBot.id, pw.bayside.id)).rejects.toThrow();
    await expect(botPrincipal(pw.r, pw.acmeBot.id, pw.acme.id, "wrong-runtime")).rejects.toThrow(/access|runtime/i);
    const seo = (await pw.r.list("bots")).find((b) => b.orgId === pw.acme.id && b.typeKey !== "prospecting")!;
    await expect(botPrincipal(pw.r, seo.id, pw.acme.id)).rejects.toThrow();
    const disabled = await addBot(pw, { status: "disabled" });
    await expect(botPrincipal(pw.r, disabled.id, pw.acme.id)).rejects.toThrow();
    const ctx = pw.ctx(principal);
    const cov = await runProspectingTool(ctx, "getMarketCoverage", { marketId: m.id });
    expect(cov).toHaveProperty("observed");
    const bm = await createMarket(pw.ops, pw.bayside.id, { nicheId: pw.roofing.id, geography: BROWARD });
    await expect(runProspectingTool(ctx, "getMarketCoverage", { marketId: bm.id })).rejects.toMatchObject({ status: 404 });
    await expect(runProspectingTool(ctx, "searchMarkets", { orgId: pw.bayside.id })).rejects.toMatchObject({ status: 404 });
    await expect(runProspectingTool(ctx, "dropTables", {})).rejects.toThrow(/Unknown tool/);
    await expect(runProspectingTool(ctx, "rejectProspect", { prospectId: "x" })).rejects.toThrow(/Invalid arguments/);
    expect(allowed(principal, "lift_suppression", pw.acme.id)).toBe(false);
    expect(allowed(principal, "spend", pw.acme.id)).toBe(false);
    expect(allowed(principal, "manage_budgets", pw.acme.id)).toBe(false);
  });

  it("tool results carry no vendor names, credentials or costs", async () => {
    const { pw, m, prospects } = await discovered();
    const ctx = pw.ctx(await botPrincipal(pw.r, pw.acmeBot.id, pw.acme.id));
    const outs = [
      await runProspectingTool(ctx, "searchMarkets", { query: "roof" }),
      await runProspectingTool(ctx, "scoreProspect", { prospectId: prospects[0].id }),
      await runProspectingTool(ctx, "getCompanySignals", { companyId: prospects[0].companyId }),
      await runProspectingTool(ctx, "scoreCompany", { companyId: prospects[0].companyId, marketId: m.id }),
      await runProspectingTool(ctx, "findWorkEmail", { prospectId: prospects[0].id }, { providers: demoSet() }),
    ];
    const blob = JSON.stringify(outs).toLowerCase();
    for (const t of [...VENDORS, "api_key", "secret", "costusd", "provenance"]) expect(blob, t).not.toContain(t);
  });

  it("tool tokens are signed, bound and expire", () => {
    process.env.PROSPECTING_TOOL_SECRET = "x".repeat(40);
    try {
      const t = issueToolToken({ botId: "bot1", orgId: "org1", runtimeId: "rt1", ttlSeconds: 60, tokenId: "tok1" }, 1_000_000);
      expect(verifyToolToken(t, 1_000_000)).toMatchObject({ botId: "bot1", orgId: "org1", runtimeId: "rt1", scopes: ["prospecting:tools"], tokenId: "tok1" });
      expect(() => verifyToolToken(t, 1_000_000 + 61_000)).toThrow(/expired/);
      const [payload, sig] = t.split(".");
      const forged = Buffer.from(JSON.stringify({ v: 2, kid: "current", b: "bot1", o: "org2", r: "rt1", scp: ["prospecting:tools"], iat: 1, e: 9e9, jti: "tok1" })).toString("base64url");
      expect(() => verifyToolToken(`${forged}.${sig}`, 1_000_000)).toThrow(/Invalid/);
      expect(() => verifyToolToken(`${payload}.AAAA`, 1_000_000)).toThrow(/Invalid/);
      const scopedOut = issueToolToken({ botId: "bot1", orgId: "org1", runtimeId: "rt1", scopes: ["other"], ttlSeconds: 60 }, 1_000_000);
      expect(() => verifyToolToken(scopedOut, 1_000_000)).toThrow(/scope/);
      delete process.env.PROSPECTING_TOOL_SECRET;
      expect(() => issueToolToken({ botId: "b", orgId: "o", runtimeId: "r" })).toThrow(/not configured/);
    } finally {
      delete process.env.PROSPECTING_TOOL_SECRET;
    }
  });
});

function files(p: string): string[] {
  if (statSync(p).isFile()) return [p];
  return readdirSync(p).flatMap((f) => files(join(p, f)));
}

describe("boundaries", () => {
  it("vendor names appear only inside the provider adapters", () => {
    const hits: string[] = [];
    for (const f of [...files("src"), ...files("convex")].filter((x) => /\.(ts|tsx)$/.test(x))) {
      if (f.startsWith(join("src", "server", "prospecting", "providers"))) continue;
      const src = readFileSync(f, "utf8").toLowerCase();
      for (const v of VENDORS) if (new RegExp(`\\b${v}\\b`).test(src)) hits.push(`${f}: ${v}`);
    }
    expect(hits).toEqual([]);
  });

  it("prospecting never names or imports the runtime engine", () => {
    const hits = files("src/server/prospecting").concat(files("src/app/ops/prospecting"), files("src/app/api/bot-tools"))
      .filter((f) => /hermes|server\/runtime/i.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  it("Convex table registry matches the platform table list", () => {
    for (const t of PROSPECT_TABLE_NAMES) {
      expect(PLATFORM_TABLES as readonly string[]).toContain(t);
      expect(TABLE_NAMES as readonly string[]).toContain(t);
    }
    expect([...APPEND_ONLY].sort()).toEqual([...APPEND_ONLY_TABLES].sort());
  });
});
