import "server-only";
import type { Bot, Runtime } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import type { RuntimeAdapter } from "./RuntimeAdapter";
import type {
  AutomationConfig,
  BotRunEvent,
  RuntimeConnection,
  StartBotRunInput,
} from "./runtime-types";
import { getRuntimeAdapter, resolveRuntimeConnection, runtimeProviderLabel } from "./runtime-factory";
import { BotNotFoundError, RuntimeUnavailableError } from "./runtime-errors";

/**
 * BotRuntime — the application's only entry point to Bot execution.
 *
 *   CLIENT / OPERATOR UI → AGENTICBOTS SERVER → BotRuntime → RuntimeAdapter → engine
 *
 * Callers hand over AgenticBots records (or ids); BotRuntime resolves the
 * server-side mapping (provider, runtime profile, secret references) and
 * picks the adapter. Runtime-side ids it returns (runtimeRunId, …) are
 * opaque mapping values to store on AgenticBots records, never to show.
 */
export class BotRuntime {
  private readonly adapter: RuntimeAdapter;
  private conn?: Promise<RuntimeConnection>;

  constructor(
    private readonly runtime: Runtime,
    private readonly bot?: Pick<Bot, "runtimeProfile" | "credentialRef">,
  ) {
    this.adapter = getRuntimeAdapter(runtime.provider);
  }

  /** Which provider actually serves this Bot (operator diagnostics). */
  get provider() {
    return this.adapter.provider;
  }
  get providerLabel() {
    return runtimeProviderLabel(this.adapter.provider);
  }
  /** True when event history can be re-read (no live stream needed). */
  get supportsEventReplay() {
    return this.adapter.traits.eventReplay;
  }

  private c(): Promise<RuntimeConnection> {
    this.conn ??= resolveRuntimeConnection(this.runtime, this.bot);
    // A failed resolution must not be cached for later calls.
    this.conn.catch(() => (this.conn = undefined));
    return this.conn;
  }

  /* Runtime */
  async getHealth() { return this.adapter.getHealth(await this.c()); }
  async getDetailedHealth() { return this.adapter.getDetailedHealth(await this.c()); }
  async listBots(runtimeProfiles: string[]) { return this.adapter.listBots(await this.c(), runtimeProfiles); }

  /* Bot */
  async getBot() { return this.adapter.getBot(await this.c()); }
  async getBotCapabilities() { return this.adapter.getBotCapabilities(await this.c()); }
  async listBotSkills() { return this.adapter.listBotSkills(await this.c()); }
  async listBotToolsets() { return this.adapter.listBotToolsets(await this.c()); }

  /* Bot Runs */
  async startBotRun(input: StartBotRunInput) { return this.adapter.startBotRun(await this.c(), input); }
  async getBotRun(runtimeRunId: string) { return this.adapter.getBotRun(await this.c(), runtimeRunId); }
  async stopBotRun(runtimeRunId: string) { return this.adapter.stopBotRun(await this.c(), runtimeRunId); }
  async listBotRunEvents(runtimeRunId: string) { return this.adapter.listBotRunEvents(await this.c(), runtimeRunId); }
  async *streamBotRunEvents(runtimeRunId: string, signal?: AbortSignal): AsyncIterable<BotRunEvent> {
    yield* this.adapter.streamBotRunEvents(await this.c(), runtimeRunId, signal);
  }
  async approveBotRun(runtimeRunId: string, approvalId?: string) { return this.adapter.approveBotRun(await this.c(), runtimeRunId, approvalId); }
  async denyBotRun(runtimeRunId: string, approvalId?: string) { return this.adapter.denyBotRun(await this.c(), runtimeRunId, approvalId); }

  /* Conversations */
  async listConversations() { return this.adapter.listConversations(await this.c()); }
  async createConversation(title: string) { return this.adapter.createConversation(await this.c(), title); }
  async getConversation(runtimeConversationId: string) { return this.adapter.getConversation(await this.c(), runtimeConversationId); }

  /* Automations */
  async listAutomations() { return this.adapter.listAutomations(await this.c()); }
  async createAutomation(config: AutomationConfig) { return this.adapter.createAutomation(await this.c(), config); }
  async updateAutomation(runtimeAutomationId: string, config: Partial<AutomationConfig>) { return this.adapter.updateAutomation(await this.c(), runtimeAutomationId, config); }
  async pauseAutomation(runtimeAutomationId: string) { return this.adapter.pauseAutomation(await this.c(), runtimeAutomationId); }
  async resumeAutomation(runtimeAutomationId: string) { return this.adapter.resumeAutomation(await this.c(), runtimeAutomationId); }
  async runAutomationNow(runtimeAutomationId: string) { return this.adapter.runAutomationNow(await this.c(), runtimeAutomationId); }
  async deleteAutomation(runtimeAutomationId: string) { return this.adapter.deleteAutomation(await this.c(), runtimeAutomationId); }
}

/** Runtime-level handle (health, listing Bots). */
export function runtimeFor(runtime: Runtime): BotRuntime {
  return new BotRuntime(runtime);
}

/** Bot-level handle from records the caller already loaded. */
export function botRuntime(runtime: Runtime, bot: Pick<Bot, "runtimeProfile" | "credentialRef">): BotRuntime {
  return new BotRuntime(runtime, bot);
}

/** Bot-level handle from an AgenticBots Bot id. */
export async function botRuntimeById(r: Repository, botId: string): Promise<BotRuntime> {
  const bot = await r.get("bots", botId);
  if (!bot) throw new BotNotFoundError("Unknown Bot");
  const runtime = await r.get("runtimes", bot.runtimeId);
  if (!runtime) throw new RuntimeUnavailableError("Bot has no runtime");
  return new BotRuntime(runtime, bot);
}

export { defaultRuntimeProvider, runtimeProviderLabel } from "./runtime-factory";
export * from "./runtime-types";
