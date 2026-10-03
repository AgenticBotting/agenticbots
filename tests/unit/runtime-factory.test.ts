import { describe, it, expect, afterEach } from "vitest";
import { getRuntimeAdapter, resolveRuntimeConnection } from "@/server/runtime/runtime-factory";
import { BotRuntime } from "@/server/runtime";
import type { Runtime } from "@/lib/platform/types";

const record = (provider: Runtime["provider"]) => ({ id: "rt-x", provider, endpointRef: undefined }) as unknown as Runtime;

afterEach(() => {
  process.env.DEMO_MODE = "true";
});

describe("runtime factory", () => {
  it("demo mode always serves the demo adapter, whatever the record says", async () => {
    expect(getRuntimeAdapter("hermes").provider).toBe("demo");
    const c = await resolveRuntimeConnection(record("hermes"), { runtimeProfile: "seo" });
    expect(c).toMatchObject({ provider: "demo", runtimeProfile: "seo" });
    expect(new BotRuntime(record("hermes"), { runtimeProfile: "seo" }).supportsEventReplay).toBe(true);
  });

  it("picks the adapter by provider outside demo mode", () => {
    process.env.DEMO_MODE = "false";
    expect(getRuntimeAdapter("hermes").provider).toBe("hermes");
    expect(getRuntimeAdapter("demo").provider).toBe("demo");
    expect(() => getRuntimeAdapter("other" as never)).toThrow(/Unknown runtime provider/);
  });

  it("a runtime with no registered endpoint is unavailable, not a crash", async () => {
    process.env.DEMO_MODE = "false";
    await expect(resolveRuntimeConnection(record("hermes"))).rejects.toMatchObject({ code: "runtime_unreachable" });
  });
});
