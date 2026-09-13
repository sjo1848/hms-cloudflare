import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { commonEn } from "./locales/en/common";
import { commonEsAR } from "./locales/es-AR/common";
import { receptionEn } from "./locales/en/reception";
import { receptionEsAR } from "./locales/es-AR/reception";
import { billingEn } from "./locales/en/billing";
import { billingEsAR } from "./locales/es-AR/billing";
import { roomsEn } from "./locales/en/rooms";
import { roomsEsAR } from "./locales/es-AR/rooms";
import { guestsEn } from "./locales/en/guests";
import { guestsEsAR } from "./locales/es-AR/guests";
import { housekeepingEn } from "./locales/en/housekeeping";
import { housekeepingEsAR } from "./locales/es-AR/housekeeping";
import { reportsEn } from "./locales/en/reports";
import { reportsEsAR } from "./locales/es-AR/reports";
import { usersEn } from "./locales/en/users";
import { usersEsAR } from "./locales/es-AR/users";
import { networkEn } from "./locales/en/network";
import { networkEsAR } from "./locales/es-AR/network";

export type Locale = "es-AR" | "en";
const STORAGE_KEY = "hms.locale";
const DEFAULT_LOCALE: Locale = "es-AR";

export const en = { ...commonEn, ...receptionEn, ...billingEn, ...roomsEn, ...guestsEn, ...housekeepingEn, ...reportsEn, ...usersEn, ...networkEn } as const;

export type MessageKey = keyof typeof en;
type Catalog = { [K in MessageKey]: string };

export const esAR: Catalog = { ...commonEsAR, ...receptionEsAR, ...billingEsAR, ...roomsEsAR, ...guestsEsAR, ...housekeepingEsAR, ...reportsEsAR, ...usersEsAR, ...networkEsAR };

const catalogs: Record<Locale, Catalog> = { en, "es-AR": esAR };

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function isLocale(value: string | null): value is Locale {
  return value === "es-AR" || value === "en";
}

export function initialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

let currentLocale: Locale = initialLocale();
export function getCurrentLocale() { return currentLocale; }

export function translateForLocale(locale: Locale, key: MessageKey, values?: Record<string, string | number>) {
  return interpolate(catalogs[locale][key], values);
}

export function pluralForLocale(locale: Locale, count: number, one: MessageKey, other: MessageKey, values?: Record<string, string | number>) {
  return translateForLocale(locale, new Intl.PluralRules(locale).select(count) === "one" ? one : other, { ...values, count });
}

export const formatCurrencyForLocale = (locale: Locale, cents: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "ARS" }).format(cents / 100);
export function formatDateForLocale(locale: Locale, isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function localizedHttpError(status: number, rawMessage?: string) {
  const locale = getCurrentLocale();
  if (locale === "en" && rawMessage) return rawMessage;
  const key: MessageKey = status === 400 ? "error.badRequest" : status === 401 ? "error.unauthorized" : status === 403 ? "error.forbidden" : status === 404 ? "error.notFound" : status === 409 ? "error.conflict" : status >= 500 ? "error.server" : "error.generic";
  return translateForLocale(locale, key);
}

const statusKeys: Record<string, MessageKey> = {
  Confirmed: "status.Confirmed", CheckedIn: "status.CheckedIn", CheckedOut: "status.CheckedOut", Cancelled: "status.Cancelled",
  Available: "status.Available", Occupied: "status.Occupied", Dirty: "status.Dirty", Cleaning: "status.Cleaning", Maintenance: "status.Maintenance", OutOfOrder: "status.OutOfOrder",
  PENDING: "status.PENDING", PAID: "status.PAID", PARTIAL: "status.PARTIAL"
};
const roleKeys: Record<string, MessageKey> = { admin: "role.admin", receptionist: "role.receptionist", ops: "role.ops", housekeeping: "role.housekeeping" };
const paymentKeys: Record<string, MessageKey> = { CASH: "payment.CASH", CARD: "payment.CARD", TRANSFER: "payment.TRANSFER" };
const priorityKeys: Record<string, MessageKey> = { LOW: "priority.LOW", MEDIUM: "priority.MEDIUM", HIGH: "priority.HIGH", URGENT: "priority.URGENT" };
const planKeys: Record<string, MessageKey> = { BASIC: "plan.BASIC", PRO: "plan.PRO", ENTERPRISE: "plan.ENTERPRISE" };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  plural: (count: number, one: MessageKey, other: MessageKey, values?: Record<string, string | number>) => string;
  statusLabel: (value: string) => string;
  roleLabel: (value: string) => string;
  paymentMethodLabel: (value: string) => string;
  priorityLabel: (value: string) => string;
  planLabel: (value: string) => string;
  formatCurrency: (cents: number) => string;
  formatDate: (isoDate: string) => string;
  formatTime: (value: string | Date) => string;
  formatNumber: (value: number) => string;
  formatPercent: (value: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    currentLocale = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: MessageKey, values?: Record<string, string | number>) => translateForLocale(locale, key, values), [locale]);
  const plural = useCallback((count: number, one: MessageKey, other: MessageKey, values?: Record<string, string | number>) => pluralForLocale(locale, count, one, other, values), [locale]);
  const statusLabel = useCallback((value: string) => statusKeys[value] ? t(statusKeys[value]) : value, [t]);
  const roleLabel = useCallback((value: string) => roleKeys[value] ? t(roleKeys[value]) : value, [t]);
  const paymentMethodLabel = useCallback((value: string) => paymentKeys[value] ? t(paymentKeys[value]) : value, [t]);
  const priorityLabel = useCallback((value: string) => priorityKeys[value] ? t(priorityKeys[value]) : value, [t]);
  const planLabel = useCallback((value: string) => planKeys[value] ? t(planKeys[value]) : value, [t]);
  const formatCurrency = useCallback((cents: number) => formatCurrencyForLocale(locale, cents), [locale]);
  const formatDate = useCallback((isoDate: string) => formatDateForLocale(locale, isoDate), [locale]);
  const formatTime = useCallback((value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: locale === "en" }).format(date);
  }, [locale]);
  const formatNumber = useCallback((value: number) => new Intl.NumberFormat(locale).format(value), [locale]);
  const formatPercent = useCallback((value: number) => new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100), [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale: updateLocale, t, plural, statusLabel, roleLabel, paymentMethodLabel, priorityLabel, planLabel, formatCurrency, formatDate, formatTime, formatNumber, formatPercent }), [locale, t, plural, statusLabel, roleLabel, paymentMethodLabel, priorityLabel, planLabel, formatCurrency, formatDate, formatTime, formatNumber, formatPercent]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
