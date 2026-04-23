import { PropsWithChildren } from "react";
import { Dock } from "../components/Dock";
import { useSettings } from "../store/AppContext";

export function AppShell({ children }: PropsWithChildren) {
  const { theme } = useSettings();

  return (
    <div className="app-bg" data-theme={theme}>
      <div className="atmosphere" aria-hidden="true" />
      <div className="layout-frame">
        <Dock />
        <main className="content-panel" aria-label="Main content">
          {children}
        </main>
      </div>
      <footer className="app-footer">
        <span>VibesAI</span>
      </footer>
    </div>
  );
}
