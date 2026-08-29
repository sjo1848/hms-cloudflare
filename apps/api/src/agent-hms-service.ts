import { WorkerEntrypoint } from "cloudflare:workers";
import {
  AgentHmsReadService,
  type AgentAvailabilityData,
  type AgentAvailabilityInput,
  type AgentHmsCallContext,
  type AgentHmsResult,
  type AgentQuoteData,
  type AgentQuoteInput,
} from "./agent-hms-read-service";

export type {
  AgentAvailabilityData,
  AgentAvailabilityInput,
  AgentHmsCallContext,
  AgentHmsErrorCode,
  AgentHmsResult,
  AgentQuoteData,
  AgentQuoteInput,
  AgentRoom,
} from "./agent-hms-read-service";

/**
 * Internal read-only RPC surface for AI Commerce Platform.
 * This named entrypoint is intentionally separate from the public/staff Hono fetch surface.
 */
export class AgentHmsService extends WorkerEntrypoint<Env> {
  public checkAvailability(
    context: AgentHmsCallContext,
    input: AgentAvailabilityInput,
  ): Promise<AgentHmsResult<AgentAvailabilityData>> {
    return new AgentHmsReadService(this.env).checkAvailability(context, input);
  }

  public getQuote(
    context: AgentHmsCallContext,
    input: AgentQuoteInput,
  ): Promise<AgentHmsResult<AgentQuoteData>> {
    return new AgentHmsReadService(this.env).getQuote(context, input);
  }
}
