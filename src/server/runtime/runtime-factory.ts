import "server-only";
import type { Bot, Runtime } from "@/lib/platform/types";
import type { RuntimeAdapter } from "./RuntimeAdapter";
import type { RuntimeConnection, RuntimeProvider } from "./runtime-types";
import { DemoRuntimeAdapter } from "./demo/DemoRuntimeAdapter";
import { HermesRuntimeAdapter } from "./hermes/HermesRuntimeAdapter";
import { awsControl } from "@/server/aws/control";
import { isDemo } from "@/server/env";
import { RuntimeAuthenticationError, RuntimeUnavailableError } from "./runtime-errors";

/**
 * The one place that decides which runtime implementation serves a
 * runtime record, and where to reach it. To add a runtime: implement
 * RuntimeAdapter in its own folder, register it here, and add its value to
 * RuntimeProvider. Nothing else changes.
 */
const ADAPTERS: Record<RuntimeProvider, () => RuntimeAdapter> = {
  demo: once(() => new DemoRuntimeAdapter()),
  hermes: once(() => new HermesRuntimeAdapter()),
};

/** Operator-facing name of each runtime provider. */
const PROVIDER_LABELS: Record<RuntimeProvider, string> = {
  demo: "Demo runtime",
  hermes: "Hermes Agent",
};

export function getRuntimeAdapter(provider: RuntimeProvider): RuntimeAdapter {
  // Demo mode always uses the demo adapter — even if a record claims a real
  // runtime — so a demo can never call out.
  if (isDemo()) return ADAPTERS.demo();
  const make = ADAPTERS[provider];
  if (!make) throw new RuntimeUnavailableError(`Unknown runtime provider: ${String(provider)}`);
  return make();
}

/** The provider that will actually serve this record (demo mode wins). */
export function effectiveProvider(runtime: Pick<Runtime, "provider">): RuntimeProvider {
  return isDemo() ? "demo" : runtime.provider;
}

/** Provider for newly provisioned client runtimes (RUNTIME_PROVIDER, default hermes). */
export function defaultRuntimeProvider(): RuntimeProvider {
  if (isDemo()) return "demo";
  const p = process.env.RUNTIME_PROVIDER as RuntimeProvider | undefined;
  return p && p in ADAPTERS ? p : "hermes";
}

export function runtimeProviderLabel(provider: RuntimeProvider): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

interface EndpointSecret {
  baseUrl: string;
  /** Key for runtime-level calls (health, capabilities). Bots use their own. */
  defaultProfileKey?: string;
  /** Private-connectivity service token. */
  accessClientId?: string;
  accessClientSecret?: string;
}

/** Development / staging override: one JSON blob instead of Secrets Manager.
 *  RUNTIME_DEV_TARGETS='{"<runtimeId>":{"baseUrl":"http://127.0.0.1:<port>","keys":{"seo":"..."}}}' */
function devTargets(): Record<string, { baseUrl: string; keys: Record<string, string> }> | null {
  const raw = process.env.RUNTIME_DEV_TARGETS;
  if (!raw || process.env.PLATFORM_ENV === "production") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Resolve the stored server-side mapping (runtime record + Bot's runtime
 * profile + secret references) into a connection. Secrets stay in server
 * memory for the duration of the call.
 */
export async function resolveRuntimeConnection(
  runtime: Runtime,
  bot?: Pick<Bot, "runtimeProfile" | "credentialRef">,
): Promise<RuntimeConnection> {
  const provider = effectiveProvider(runtime);
  const base = { provider, runtimeId: runtime.id, runtimeProfile: bot?.runtimeProfile };
  if (provider === "demo") {
    return { ...base, endpoint: "demo://runtime", credentials: { apiKey: "demo" } };
  }
  const dev = devTargets()?.[runtime.id];
  if (dev) {
    const profile = bot?.runtimeProfile ?? "default";
    const apiKey = dev.keys[profile] ?? dev.keys.default;
    if (!apiKey) throw new RuntimeAuthenticationError(`No dev key for Bot ${profile}`);
    return { ...base, endpoint: dev.baseUrl, credentials: { apiKey } };
  }
  if (!runtime.endpointRef) throw new RuntimeUnavailableError("Runtime endpoint is not registered");
  const aws = awsControl();
  const ep = await aws.getSecretJson<EndpointSecret>(runtime.endpointRef);
  // Bot calls use that Bot's own key; runtime-level calls use the default key.
  const keyRef = bot?.credentialRef ?? (bot ? `${runtime.endpointRef.replace(/\/runtime$/, "")}/profiles/${bot.runtimeProfile}` : undefined);
  const apiKey = keyRef ? (await aws.getSecretJson<{ apiKey: string }>(keyRef)).apiKey : ep.defaultProfileKey;
  if (!ep.baseUrl || !apiKey) throw new RuntimeAuthenticationError("Runtime credentials incomplete");
  return {
    ...base,
    endpoint: ep.baseUrl,
    credentials: { apiKey, accessClientId: ep.accessClientId, accessClientSecret: ep.accessClientSecret },
  };
}

function once<T>(make: () => T): () => T {
  let v: T | undefined;
  return () => (v ??= make());
}
