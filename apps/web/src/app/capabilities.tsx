import { createContext } from "react";

export type EffectiveCapabilities = {
  hotel: readonly string[];
  network: readonly string[];
};

export const EMPTY_CAPABILITIES: EffectiveCapabilities = {
  hotel: [],
  network: [],
};

export const AUTHORIZATION_STALE_EVENT = "hms:authorization-stale";

export function notifyAuthorizationStale() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTHORIZATION_STALE_EVENT));
}

export const CapabilitiesContext = createContext<EffectiveCapabilities>(EMPTY_CAPABILITIES);
