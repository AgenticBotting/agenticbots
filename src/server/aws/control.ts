import "server-only";
import { isDemo, assertLive, cloudChangesAllowed } from "@/server/env";
import { demoState } from "@/server/runtime/demo/DemoRuntimeAdapter";
import { RuntimeError } from "@/server/runtime/runtime-errors";

/**
 * AWS control plane for client runtimes.
 *
 * The web app can do exactly these things, nothing else:
 *   - read instance state
 *   - invoke ONE pre-registered SSM document (AgenticBots-RuntimeLifecycle)
 *     with an action from a fixed list — never an arbitrary shell command
 *   - read a tenant's secrets from Secrets Manager
 *   - read CloudWatch metrics
 *
 * Credentials come from Vercel OIDC federation (AWS_ROLE_ARN) — no static
 * access keys are stored in Vercel. The IAM policy in
 * infra/terraform/modules/control-plane-role restricts every call to
 * resources tagged agenticbots:managed=true.
 */
export type LifecycleAction =
  | "status"
  | "start-runtime"
  | "stop-runtime"
  | "restart-runtime"
  | "park-bot"
  | "unpark-bot"
  | "deploy-bot"
  | "backup-now";

export const LIFECYCLE_ACTIONS: readonly LifecycleAction[] = [
  "status", "start-runtime", "stop-runtime", "restart-runtime", "park-bot", "unpark-bot", "deploy-bot", "backup-now",
];

export const LIFECYCLE_DOCUMENT = process.env.AWS_LIFECYCLE_DOCUMENT ?? "AgenticBots-RuntimeLifecycle";

export interface CommandResult {
  commandId: string;
  status: "pending" | "in_progress" | "success" | "failed" | "timed_out" | "cancelled";
  output?: string;
}

export interface AwsControl {
  readonly kind: "demo" | "aws";
  describeInstance(instanceId: string): Promise<{ state: string; instanceType?: string; launchTime?: string }>;
  runLifecycle(runtimeId: string, instanceId: string, action: LifecycleAction, params?: Record<string, string>): Promise<CommandResult>;
  getCommand(commandId: string, instanceId: string): Promise<CommandResult>;
  getSecretJson<T = Record<string, string>>(secretId: string): Promise<T>;
  diskUsedPct(instanceId: string): Promise<number | undefined>;
}

/* ───────────────────────────── demo ───────────────────────────── */

class DemoAwsControl implements AwsControl {
  readonly kind = "demo" as const;
  async describeInstance() {
    return { state: "running", instanceType: "t3.medium" };
  }
  async runLifecycle(runtimeId: string, _instanceId: string, action: LifecycleAction, params: Record<string, string> = {}) {
    const st = demoState();
    if (action === "stop-runtime") st.stopped.add(runtimeId);
    if (action === "start-runtime" || action === "restart-runtime") st.stopped.delete(runtimeId);
    if (action === "park-bot" && params.profile) st.parked.add(`${runtimeId}:${params.profile}`);
    if (action === "unpark-bot" && params.profile) st.parked.delete(`${runtimeId}:${params.profile}`);
    if (action === "deploy-bot" && params.profile) st.parked.delete(`${runtimeId}:${params.profile}`);
    return { commandId: `demo-cmd-${Date.now()}`, status: "success" as const, output: `demo: ${action} ok` };
  }
  async getCommand(commandId: string) {
    return { commandId, status: "success" as const };
  }
  async getSecretJson<T>(): Promise<T> {
    throw new RuntimeError("runtime_auth", "Demo mode has no secrets store");
  }
  async diskUsedPct() {
    return 29;
  }
}

/* ────────────────────────────── AWS ───────────────────────────── */

async function credentials() {
  const roleArn = process.env.AWS_ROLE_ARN;
  if (roleArn) {
    // Vercel OIDC → STS AssumeRoleWithWebIdentity. Short-lived, no stored keys.
    const { awsCredentialsProvider } = await import("@vercel/functions/oidc");
    return awsCredentialsProvider({ roleArn });
  }
  // Local CLI / CI: the default provider chain (AWS SSO profile etc.).
  return undefined;
}

class RealAwsControl implements AwsControl {
  readonly kind = "aws" as const;
  private region = process.env.AWS_REGION ?? "us-east-2";
  private secretCache = new Map<string, { at: number; value: unknown }>();

  private async ec2() {
    const { EC2Client } = await import("@aws-sdk/client-ec2");
    return new EC2Client({ region: this.region, credentials: await credentials() });
  }
  private async ssm() {
    const { SSMClient } = await import("@aws-sdk/client-ssm");
    return new SSMClient({ region: this.region, credentials: await credentials() });
  }

  async describeInstance(instanceId: string) {
    const { DescribeInstancesCommand } = await import("@aws-sdk/client-ec2");
    const out = await (await this.ec2()).send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const inst = out.Reservations?.[0]?.Instances?.[0];
    return {
      state: inst?.State?.Name ?? "unknown",
      instanceType: inst?.InstanceType,
      launchTime: inst?.LaunchTime?.toISOString(),
    };
  }

  async runLifecycle(runtimeId: string, instanceId: string, action: LifecycleAction, params: Record<string, string> = {}) {
    if (!LIFECYCLE_ACTIONS.includes(action)) throw new Error(`Unknown lifecycle action ${action}`);
    if (action !== "status") assertLive(`runtime ${action}`);
    for (const [k, v] of Object.entries(params)) {
      // Parameters are interpolated by the SSM document; keep them boring.
      if (!/^[a-z0-9_-]{1,40}$/.test(k) || !/^[A-Za-z0-9_.:-]{0,80}$/.test(v)) {
        throw new Error("Invalid lifecycle parameter");
      }
    }
    const { SendCommandCommand } = await import("@aws-sdk/client-ssm");
    const out = await (await this.ssm()).send(
      new SendCommandCommand({
        DocumentName: LIFECYCLE_DOCUMENT,
        InstanceIds: [instanceId],
        Parameters: { action: [action], profile: [params.profile ?? "none"], runtimeId: [runtimeId] },
        Comment: `agenticbots ${action}`.slice(0, 100),
        TimeoutSeconds: 600,
      }),
    );
    return { commandId: out.Command?.CommandId ?? "", status: "pending" as const };
  }

  async getCommand(commandId: string, instanceId: string): Promise<CommandResult> {
    const { GetCommandInvocationCommand } = await import("@aws-sdk/client-ssm");
    try {
      const out = await (await this.ssm()).send(new GetCommandInvocationCommand({ CommandId: commandId, InstanceId: instanceId }));
      const map: Record<string, CommandResult["status"]> = {
        Pending: "pending", InProgress: "in_progress", Delayed: "pending", Success: "success",
        Cancelled: "cancelled", TimedOut: "timed_out", Failed: "failed", Cancelling: "cancelled",
      };
      return { commandId, status: map[out.Status ?? "Pending"] ?? "pending", output: (out.StandardOutputContent ?? "").slice(-2000) };
    } catch {
      return { commandId, status: "pending" };
    }
  }

  async getSecretJson<T = Record<string, string>>(secretId: string): Promise<T> {
    const hit = this.secretCache.get(secretId);
    if (hit && Date.now() - hit.at < 5 * 60_000) return hit.value as T;
    const { SecretsManagerClient, GetSecretValueCommand } = await import("@aws-sdk/client-secrets-manager");
    const client = new SecretsManagerClient({ region: this.region, credentials: await credentials() });
    const out = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
    const value = JSON.parse(out.SecretString ?? "{}") as T;
    this.secretCache.set(secretId, { at: Date.now(), value });
    return value;
  }

  async diskUsedPct(instanceId: string) {
    const { CloudWatchClient, GetMetricStatisticsCommand } = await import("@aws-sdk/client-cloudwatch");
    const client = new CloudWatchClient({ region: this.region, credentials: await credentials() });
    const end = new Date();
    const out = await client.send(
      new GetMetricStatisticsCommand({
        Namespace: "AgenticBots/Runtime",
        MetricName: "disk_used_percent",
        Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        StartTime: new Date(end.getTime() - 30 * 60_000),
        EndTime: end,
        Period: 300,
        Statistics: ["Maximum"],
      }),
    );
    const pts = (out.Datapoints ?? []).sort((a, b) => (b.Timestamp?.getTime() ?? 0) - (a.Timestamp?.getTime() ?? 0));
    return pts[0]?.Maximum;
  }
}

let cached: AwsControl | undefined;
export function awsControl(): AwsControl {
  cached ??= isDemo() ? new DemoAwsControl() : new RealAwsControl();
  return cached;
}

/** Poll an SSM lifecycle command until it finishes (or the budget runs out). */
export async function waitForCommand(
  aws: AwsControl,
  cmd: CommandResult,
  instanceId: string,
  budgetMs = 240_000,
  pollMs = 5_000,
): Promise<CommandResult> {
  if (cmd.status !== "pending" && cmd.status !== "in_progress") return cmd;
  const deadline = Date.now() + budgetMs;
  let last = cmd;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs));
    last = await aws.getCommand(cmd.commandId, instanceId);
    if (last.status !== "pending" && last.status !== "in_progress") return last;
  }
  return last;
}

/** Infra mutation guard used by the provisioning CLI. */
export function assertCloudChangesAllowed(what: string): void {
  if (!cloudChangesAllowed()) {
    throw new Error(`Refusing to ${what}: set ALLOW_CLOUD_CHANGES=1 to permit real cloud changes.`);
  }
}
