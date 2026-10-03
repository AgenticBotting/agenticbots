import { describe, it, expect, vi, afterEach } from "vitest";
import type { Runtime } from "@/lib/platform/types";

/** Secrets Manager → connection resolution, as used on staging/production. */
const secrets: Record<string, unknown> = {
  "agenticbots/staging/tenants/t1/runtime": {
    baseUrl: "https://t1.runtime.example.com",
    defaultProfileKey: "default-key-0123456789",
    accessClientId: "cid",
    accessClientSecret: "csecret",
    tunnelToken: "never-used-by-the-app",
  },
  "agenticbots/staging/tenants/t1/profiles/seo": { apiKey: "seo-key-0123456789" },
};
vi.mock("@/server/aws/control", () => ({
  awsControl: () => ({
    getSecretJson: async (id: string) => {
      if (!(id in secrets)) throw new Error(`ResourceNotFoundException: ${id}`);
      return secrets[id];
    },
  }),
}));

const { resolveRuntimeConnection } = await import("@/server/runtime/runtime-factory");
const runtime = { id: "rt1", provider: "hermes", endpointRef: "agenticbots/staging/tenants/t1/runtime" } as unknown as Runtime;

afterEach(() => {
  process.env.DEMO_MODE = "true";
});

describe("runtime connection from Secrets Manager", () => {
  it("runtime-level calls (health, capabilities) use the runtime's default key", async () => {
    process.env.DEMO_MODE = "false";
    const c = await resolveRuntimeConnection(runtime);
    expect(c).toMatchObject({ provider: "hermes", endpoint: "https://t1.runtime.example.com", runtimeProfile: undefined });
    expect(c.credentials).toEqual({ apiKey: "default-key-0123456789", accessClientId: "cid", accessClientSecret: "csecret" });
  });

  it("Bot calls use that Bot's own key, never the default one", async () => {
    process.env.DEMO_MODE = "false";
    const c = await resolveRuntimeConnection(runtime, { runtimeProfile: "seo", credentialRef: "agenticbots/staging/tenants/t1/profiles/seo" });
    expect(c.runtimeProfile).toBe("seo");
    expect(c.credentials.apiKey).toBe("seo-key-0123456789");
    // Derived from the endpoint path when the Bot has no explicit reference.
    const d = await resolveRuntimeConnection(runtime, { runtimeProfile: "seo", credentialRef: undefined });
    expect(d.credentials.apiKey).toBe("seo-key-0123456789");
  });

  it("a Bot whose key has not been written yet is an error, not the default key", async () => {
    process.env.DEMO_MODE = "false";
    await expect(resolveRuntimeConnection(runtime, { runtimeProfile: "ads", credentialRef: undefined })).rejects.toThrow(/ResourceNotFound/);
  });
});
