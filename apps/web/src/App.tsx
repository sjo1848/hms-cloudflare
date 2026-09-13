import { AppShell } from "./app/AppShell";
import { RouterProvider } from "./app/router";
import { I18nProvider } from "./i18n";

export function App() {
  return <I18nProvider><RouterProvider><AppShell /></RouterProvider></I18nProvider>;
}
