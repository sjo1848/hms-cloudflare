import { getActiveLocalProfileIndex, localAcceptanceEnabled, localDevProfiles, setActiveLocalProfileIndex } from "../api/client";
import { useI18n } from "../i18n";

export function LocalDevIdentitySelector({ onChange }: { onChange: () => void }) {
  const { t } = useI18n();
  if (!localAcceptanceEnabled) return null;
  return <aside className="local-dev-identity" aria-label={t("local.identity")}><strong>{t("local.identity")}</strong><label>{t("local.profile")} <select aria-label={t("local.profile")} value={String(getActiveLocalProfileIndex())} onChange={event => { setActiveLocalProfileIndex(Number(event.target.value)); onChange(); }}>{localDevProfiles.map((profile, index) => <option value={index} key={profile.subject}>{profile.label}</option>)}</select></label><small>{t("local.synthetic")}</small></aside>;
}
