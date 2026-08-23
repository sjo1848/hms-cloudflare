import { ApiError } from "./errors";

export function requiredText(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") {
    throw ApiError.badRequest(`${field} must be text`);
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw ApiError.badRequest(`${field} length is invalid`);
  }
  return normalized;
}

export function integerCents(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw ApiError.badRequest(`${field} must be a non-negative integer`);
  }
  return value;
}

export function isoDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw ApiError.badRequest(`${field} must be YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw ApiError.badRequest(`${field} must be a valid date`);
  }
  return value;
}

export function dateRange(start: unknown, end: unknown): { start: string; end: string } {
  const normalizedStart = isoDate(start, "start");
  const normalizedEnd = isoDate(end, "end");
  if (normalizedEnd <= normalizedStart) {
    throw ApiError.badRequest("end must be after start");
  }
  return { start: normalizedStart, end: normalizedEnd };
}

export function email(value: unknown): string {
  const normalized = requiredText(value, "email", 5, 150).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    throw ApiError.badRequest("email is invalid");
  }
  return normalized;
}

export async function jsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw ApiError.badRequest("JSON body is invalid");
  }
}
