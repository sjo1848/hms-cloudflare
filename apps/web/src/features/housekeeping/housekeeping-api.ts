import { api } from "../../api/client";
import type { HousekeepingBoard } from "./model";

export function loadHousekeepingBoard(date: string) {
  return api<HousekeepingBoard>(`/housekeeping/board?date=${date}`);
}

export function runHousekeepingAction(path: string, body?: Record<string, unknown>) {
  return api(path, { method: "POST", body: JSON.stringify(body ?? {}) });
}
