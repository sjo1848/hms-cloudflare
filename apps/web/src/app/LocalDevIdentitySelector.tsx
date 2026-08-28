import { getActiveLocalProfileIndex, localAcceptanceEnabled, localDevProfiles, setActiveLocalProfileIndex } from "../api/client";

export function LocalDevIdentitySelector({ onChange }: { onChange: () => void }) {
  if (!localAcceptanceEnabled) return null;
  return <aside className="local-dev-identity" aria-label="Local acceptance identity"><strong>Local acceptance identity</strong><label>Profile <select aria-label="Local acceptance profile" value={String(getActiveLocalProfileIndex())} onChange={event => { setActiveLocalProfileIndex(Number(event.target.value)); onChange(); }}>{localDevProfiles.map((profile, index) => <option value={index} key={profile.subject}>{profile.label}</option>)}</select></label><small>Synthetic fixture only · not persisted</small></aside>;
}
