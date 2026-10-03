import "server-only";
import type { Bot, Runtime } from "@/lib/platform/types";
import type { RuntimeAdapter, RuntimeTarget } from "./adapter";
import { DemoRuntimeAdapter } from "./demo/adapter";
import { HermesRuntimeAdapter } from "./hermes/adapter";
import { awsControl } from "@/server/aws/control";
import { isDemo } from "@/server/env";
import { RuntimeError } from "./errors";

/**
 * Picks the adapter for a runtime record and resolves where to reach it.
 * Demo mode always uses the demo adapter — even if a record claims to be a
 * real runtime — so a demo can never call out.
 */
const demo = new DemoRuntimeAdapter();
const hermes = new HermesRuntimeAdapter();

export function adapterFor(runtime: Pick<Runtime, "kind">): RuntimeAdapter {
  if (isDemo() || runtime.kind === "demo") return demo;
  return hermes;
}

export function demoAdapter(): DemoRuntimeAdapter {
  return demo;
}

interface EndpointSecret {
  baseUrl: string;
  /** Private-connectivity service token (Cloudflare Access). */
  accessClientId?: string;
  accessClientSecret?: string;
}

/** Development / staging override: one JSON blob instead of Secrets Manager.
 *  RUNTIME_DEV_TARGETS='{"<runtimeId>":{"baseUrl":"http://127.0.0.1:8642","keys":{"seo":"..."}}}' */
function devTargets(): Record<string, { baseUrl: string; keys: Record<string, string> }> | null {
  const raw = process.env.RUNTIME_DEV_TARGETS;
  if (!raw || process.env.PLATFORM_ENV === "production") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function resolveTarget(runtime: Runtime, bot?: Pick<Bot, "runtimeProfile" | "credentialRef">): Promise<RuntimeTarget> {
  if (isDemo() || runtime.kind === "demo") {
    return { runtimeId: runtime.id, profile: bot?.runtimeProfile, baseUrl: "demo://runtime", apiKey: "demo", extraHeaders: {} };
  }
  const dev = devTargets()?.[runtime.id];
  if (dev) {
    const profile = bot?.runtimeProfile ?? "default";
    const apiKey = dev.keys[profile] ?? dev.keys.default;
    if (!apiKey) throw new RuntimeError("runtime_auth", `No dev key for profile ${profile}`);
    return { runtimeId: runtime.id, profile: bot?.runtimeProfile, baseUrl: dev.baseUrl, apiKey, extraHeaders: {} };
  }
  if (!runtime.endpointRef) throw new RuntimeError("runtime_unreachable", "Runtime endpoint is not registered");
  const aws = awsControl();
  const ep = await aws.getSecretJson<EndpointSecret>(runtime.endpointRef);
  const keyRef = bot?.credentialRef ?? `${runtime.endpointRef.replace(/\/runtime$/, "")}/profiles/default`;
  const { apiKey } = await aws.getSecretJson<{ apiKey: string }>(keyRef);
  if (!ep.baseUrl || !apiKey) throw new RuntimeError("runtime_auth", "Runtime credentials incomplete");
  const extraHeaders: Record<string, string> = {};
  if (ep.accessClientId && ep.accessClientSecret) {
    extraHeaders["CF-Access-Client-Id"] = ep.accessClientId;
    extraHeaders["CF-Access-Client-Secret"] = ep.accessClientSecret;
  }
  return { runtimeId: runtime.id, profile: bot?.runtimeProfile, baseUrl: ep.baseUrl, apiKey, extraHeaders };
}
