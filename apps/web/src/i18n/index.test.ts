import { describe, expect, it } from "vitest";
import { en, esAR, formatCurrencyForLocale, formatDateForLocale, initialLocale, pluralForLocale, translateForLocale } from "./index";

describe("typed HMS i18n", () => {
  it("keeps exact catalog parity and defaults to es-AR outside the browser", () => {
    expect(Object.keys(esAR)).toEqual(Object.keys(en));
    expect(initialLocale()).toBe("es-AR");
  });

  it("translates representative validation, error and room state messages", () => {
    expect(translateForLocale("es-AR", "error.conflict")).toContain("conflicto");
    expect(translateForLocale("es-AR", "status.Dirty")).toBe("Por limpiar");
    expect(translateForLocale("en", "status.Dirty")).toBe("Dirty");
  });

  it("formats Argentine dates and ARS currency with Intl", () => {
    expect(formatDateForLocale("es-AR", "2026-08-29")).toBe("29/08/2026");
    expect(formatCurrencyForLocale("es-AR", 123456)).toContain("1.234,56");
  });

  it("selects plural forms with Intl.PluralRules", () => {
    expect(pluralForLocale("es-AR", 1, "common.room", "common.rooms")).toBe("Habitación");
    expect(pluralForLocale("es-AR", 2, "common.room", "common.rooms")).toBe("habitaciones");
  });
});
