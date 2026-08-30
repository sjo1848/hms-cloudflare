import { WorkerEntrypoint } from "cloudflare:workers";
import {
  authorizeAgentHmsCall,
  type AgentHmsCallerProps,
} from "./agent-hms-authorization";
import {
  AgentHmsReadService,
  type AgentAvailabilityData,
  type AgentAvailabilityInput,
  type AgentHmsCallContext,
  type AgentHmsResult,
  type AgentQuoteData,
  type AgentQuoteInput,
} from "./agent-hms-read-service";
import {
  AgentHmsReservationService,
  type AgentReservationData,
  type AgentReservationInput,
} from "./agent-hms-reservation-service";

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
export type { AgentReservationData, AgentReservationInput } from "./agent-hms-reservation-service";
export type { AgentHmsCallerProps, AgentHmsPermission } from "./agent-hms-authorization";

/**
 * Internal capability-scoped RPC surface for AI Commerce Platform.
 * The Service Binding supplies authenticated capability props. Cloudflare owns
 * their authenticity; user/model input cannot set or override them.
 */
export class AgentHmsService extends WorkerEntrypoint<Env, AgentHmsCallerProps> {
  public checkAvailability(
    context: AgentHmsCallContext,
    input: AgentAvailabilityInput,
  ): Promise<AgentHmsResult<AgentAvailabilityData>> {
    authorizeAgentHmsCall(this.ctx.props, context, "availability.read");
    return new AgentHmsReadService(this.env).checkAvailability(context, input);
  }

  public getQuote(
    context: AgentHmsCallContext,
    input: AgentQuoteInput,
  ): Promise<AgentHmsResult<AgentQuoteData>> {
    authorizeAgentHmsCall(this.ctx.props, context, "quote.read");
    return new AgentHmsReadService(this.env).getQuote(context, input);
  }

  public createReservation(
    context: AgentHmsCallContext,
    input: AgentReservationInput,
  ): Promise<AgentHmsResult<AgentReservationData>> {
    authorizeAgentHmsCall(this.ctx.props, context, "reservation.write");
    return new AgentHmsReservationService(this.env).createReservation(context, input);
  }
}
