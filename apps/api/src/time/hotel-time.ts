export type HotelTimeContext = {
  timeZone: string;
  localDate: string;
  nowIso: string;
};

const dateParts = (timeZone: string, instant: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  const year = pick("year"), month = pick("month"), day = pick("day");
  if (!year || !month || !day) throw new Error("Unable to derive hotel-local date");
  return `${year}-${month}-${day}`;
};

export function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function hotelLocalDate(timeZone: string, instant = new Date()): string {
  if (!isIanaTimeZone(timeZone)) throw new Error(`Invalid IANA timezone: ${timeZone}`);
  return dateParts(timeZone, instant);
}

export function createHotelTimeContext(timeZone: string, instant = new Date()): HotelTimeContext {
  return {
    timeZone,
    localDate: hotelLocalDate(timeZone, instant),
    nowIso: instant.toISOString(),
  };
}

export function parseExplicitOffsetInstant(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}
