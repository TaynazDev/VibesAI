import { PropsWithChildren } from "react";
import { Dock } from "../components/Dock";
import { PrismSuiteLogo } from "../components/BrandLogo";

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
        <PrismSuiteLogo className="footer-prism-logo" />
        <span>VibesAI by Prism</span>
      </footer>
    </div>
  );
}
