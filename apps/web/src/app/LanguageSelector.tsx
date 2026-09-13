import { useI18n } from "../i18n";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  return <label className="language-selector"><span>{t("language.label")}</span><select aria-label={t("language.label")} value={locale} onChange={event => setLocale(event.target.value as "es-AR" | "en")}><option value="es-AR">{t("language.spanish")}</option><option value="en">{t("language.english")}</option></select></label>;
}
