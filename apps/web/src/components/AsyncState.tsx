type AsyncStateProps = {
  kind: "loading" | "error" | "empty";
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function AsyncState({ kind, title, message, onRetry }: AsyncStateProps) {
  const { t } = useI18n();
  const className = kind === "error" ? "state-panel state-error" : kind === "empty" ? "state-panel state-empty" : "state-panel";
  const role = kind === "error" ? "alert" : kind === "loading" ? "status" : undefined;
  return <div className={className} role={role}>
    {kind === "loading" && <span className="state-spinner" />}
    {title && <strong>{title}</strong>}
    <span>{message}</span>
    {onRetry && <button type="button" onClick={onRetry}>{t("common.retry")}</button>}
  </div>;
}
import { useI18n } from "../i18n";
