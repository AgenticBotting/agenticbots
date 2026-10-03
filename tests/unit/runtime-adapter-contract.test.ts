import { describeRuntimeAdapterContract } from "../contract/runtime-adapter.contract";
import { DemoRuntimeAdapter, demoState } from "@/server/runtime/demo/DemoRuntimeAdapter";
import { HermesRuntimeAdapter } from "@/server/runtime/hermes/HermesRuntimeAdapter";
import { startFakeHermes } from "../support/fake-hermes";

/** The same contract, run against every adapter. */

describeRuntimeAdapterContract("demo", async () => {
  const bot = { provider: "demo" as const, runtimeId: "rt-contract", runtimeProfile: "seo", endpoint: "demo://runtime", credentials: { apiKey: "demo" } };
  demoState().stopped.add("rt-contract-down");
  return {
    adapter: new DemoRuntimeAdapter(),
    bot,
    unreachable: { ...bot, runtimeId: "rt-contract-down" },
    // Demo Runs follow a timeline; shift it so the next phase has happened.
    async advance(id) {
      const r = demoState().runs.get(id)!;
      if (r.approved || r.denied) r.approvalAt = Date.now() - 60_000;
      else r.startedAt = Date.now() - 60_000;
    },
  };
});

describeRuntimeAdapterContract("hermes (fake server)", async () => {
  const fake = await startFakeHermes();
  const bot = { provider: "hermes" as const, runtimeId: "rt-contract", runtimeProfile: "seo", endpoint: fake.url, credentials: { apiKey: fake.keys.seo } };
  return {
    adapter: new HermesRuntimeAdapter(),
    bot,
    unreachable: { ...bot, endpoint: "http://127.0.0.1:9" },
    async advance(id) {
      fake.advance(id);
    },
    teardown: () => fake.close(),
  };
});
