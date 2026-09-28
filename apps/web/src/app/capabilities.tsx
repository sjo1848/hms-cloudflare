import { createContext } from "react";

export type EffectiveCapabilities = {
  hotel: readonly string[];
  network: readonly string[];
};

export const EMPTY_CAPABILITIES: EffectiveCapabilities = {
  hotel: [],
  network: [],
};

export const CapabilitiesContext = createContext<EffectiveCapabilities>(EMPTY_CAPABILITIES);
