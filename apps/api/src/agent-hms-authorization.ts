import { ApiError } from "./errors";
import type { AgentHmsCallContext } from "./agent-hms-read-service";

export type AgentHmsPermission = "availability.read" | "quote.read";

export type AgentHmsCallerProps = {
  clientId: string;
  permissions: AgentHmsPermission[];
  allowedHotelIds: string[];
};

export function authorizeAgentHmsCall(
  props: AgentHmsCallerProps | undefined,
  context: AgentHmsCallContext,
  permission: AgentHmsPermission,
): void {
  if (!props || props.clientId !== "ai-commerce-platform") {
    throw ApiError.forbidden("Agent HMS caller is not authorized");
  }
  if (!Array.isArray(props.permissions) || !props.permissions.includes(permission)) {
    throw ApiError.forbidden("Agent HMS capability is not authorized");
  }
  if (!Array.isArray(props.allowedHotelIds) || !props.allowedHotelIds.includes(context.hotelId)) {
    throw ApiError.forbidden("Agent HMS hotel is not authorized for this binding");
  }
}
