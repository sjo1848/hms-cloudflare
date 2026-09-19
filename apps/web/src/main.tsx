import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { preloadI18n } from "./i18n";
import "./styles.css";

async function bootstrap() {
  await preloadI18n();
  createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
}

void bootstrap().catch(error => {
  console.error(error);
  const root = document.getElementById("root");
  if (root) root.textContent = "HMS could not load application resources.";
});
