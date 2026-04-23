import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { SplashScreen } from "./components/SplashScreen";
import { AccountPage } from "./features/account/AccountPage";
import { BuildPage } from "./features/builder/BuildPage";
import { ComingSoonPage } from "./features/coming-soon/ComingSoonPage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { ProjectDetailPage } from "./features/projects/ProjectDetailPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AppProvider, useSettings } from "./store/AppContext";

function AppInner() {
  const { theme } = useSettings();
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("va_splash_done") === "1"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyThemeHead = () => {
      const resolvedTheme = theme === "system"
        ? (media.matches ? "dark" : "light")
        : theme;
      const iconHref = resolvedTheme === "dark"
        ? "/branding/vibesai-logo-dark.jpg"
        : "/branding/vibesai-logo-light.jpg";

      let iconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!iconLink) {
        iconLink = document.createElement("link");
        iconLink.rel = "icon";
        document.head.appendChild(iconLink);
      }
      iconLink.type = "image/jpeg";
      iconLink.href = iconHref;

      let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
      if (!themeColor) {
        themeColor = document.createElement("meta");
        themeColor.name = "theme-color";
        document.head.appendChild(themeColor);
      }
      themeColor.content = resolvedTheme === "dark" ? "#08080e" : "#f8f9fc";
    };

    applyThemeHead();
    if (theme !== "system") {
      return;
    }

    media.addEventListener("change", applyThemeHead);
    return () => media.removeEventListener("change", applyThemeHead);
  }, [theme]);

  const handleSplashDone = () => {
    sessionStorage.setItem("va_splash_done", "1");
    setSplashDone(true);
  };

  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<BuildPage />} />
        <Route path="/builder/:id" element={<BuildPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
