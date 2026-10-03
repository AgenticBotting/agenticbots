import "server-only";
import type {
  AutomationConfig,
  BotRunEvent,
  RuntimeAutomation,
  RuntimeBot,
  RuntimeBotRun,
  RuntimeCapabilities,
  RuntimeConnection,
  RuntimeConversation,
  RuntimeHealthReport,
  RuntimeProvider,
  RuntimeSkill,
  RuntimeToolset,
  StartBotRunInput,
  StartedBotRun,
} from "./runtime-types";

/**
 * RuntimeAdapter — what AgenticBots needs from ANY Bot runtime.
 *
 * Implementations are stateless translators: every call receives the
 * resolved RuntimeConnection for the Bot (or runtime) it concerns. The rest
 * of the application never calls an adapter directly — it goes through the
 * BotRuntime facade in ./index.ts, which resolves connections from
 * AgenticBots records.
 *
 * Implementations: DemoRuntimeAdapter (./demo) and HermesRuntimeAdapter
 * (./hermes). Every method throws only the errors in ./runtime-errors.ts.
 */
export interface RuntimeAdapter {
  readonly provider: RuntimeProvider;
  /** Static traits that never need a network call to discover. */
  readonly traits: { eventReplay: boolean };

  getHealth(c: RuntimeConnection): Promise<RuntimeHealthReport>;
  getDetailedHealth(c: RuntimeConnection): Promise<RuntimeHealthReport>;

  /** Report each of the given Bots (by runtime profile) as the runtime sees it. */
  listBots(c: RuntimeConnection, runtimeProfiles: string[]): Promise<RuntimeBot[]>;
  getBot(c: RuntimeConnection): Promise<RuntimeBot>;
  getBotCapabilities(c: RuntimeConnection): Promise<RuntimeCapabilities>;
  listBotSkills(c: RuntimeConnection): Promise<RuntimeSkill[]>;
  listBotToolsets(c: RuntimeConnection): Promise<RuntimeToolset[]>;

  startBotRun(c: RuntimeConnection, input: StartBotRunInput): Promise<StartedBotRun>;
  getBotRun(c: RuntimeConnection, runtimeRunId: string): Promise<RuntimeBotRun>;
  stopBotRun(c: RuntimeConnection, runtimeRunId: string): Promise<void>;
  /** Live event stream. May be consume-once (see traits.eventReplay). */
  streamBotRunEvents(c: RuntimeConnection, runtimeRunId: string, signal?: AbortSignal): AsyncIterable<BotRunEvent>;
  /** Full event history so far. Only when traits.eventReplay is true;
   *  otherwise throws CapabilityUnavailableError. */
  listBotRunEvents(c: RuntimeConnection, runtimeRunId: string): Promise<BotRunEvent[]>;
  approveBotRun(c: RuntimeConnection, runtimeRunId: string, approvalId?: string): Promise<void>;
  denyBotRun(c: RuntimeConnection, runtimeRunId: string, approvalId?: string): Promise<void>;

  listConversations(c: RuntimeConnection): Promise<RuntimeConversation[]>;
  createConversation(c: RuntimeConnection, title: string): Promise<RuntimeConversation>;
  getConversation(c: RuntimeConnection, runtimeConversationId: string): Promise<RuntimeConversation>;

  listAutomations(c: RuntimeConnection): Promise<RuntimeAutomation[]>;
  createAutomation(c: RuntimeConnection, config: AutomationConfig): Promise<RuntimeAutomation>;
  updateAutomation(c: RuntimeConnection, runtimeAutomationId: string, config: Partial<AutomationConfig>): Promise<RuntimeAutomation>;
  pauseAutomation(c: RuntimeConnection, runtimeAutomationId: string): Promise<void>;
  resumeAutomation(c: RuntimeConnection, runtimeAutomationId: string): Promise<void>;
  runAutomationNow(c: RuntimeConnection, runtimeAutomationId: string): Promise<void>;
  deleteAutomation(c: RuntimeConnection, runtimeAutomationId: string): Promise<void>;
}
