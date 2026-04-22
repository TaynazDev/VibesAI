import { PropsWithChildren } from "react";
import { Dock } from "../components/Dock";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-bg">
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
