import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { OnboardingPage } from "./components/OnboardingPage";
import { SplashScreen } from "./components/SplashScreen";
import { AccountPage } from "./features/account/AccountPage";
import { BuildPage } from "./features/builder/BuildPage";
import { ComingSoonPage } from "./features/coming-soon/ComingSoonPage";
import { ExpressEditPage } from "./features/express/ExpressEditPage";
import { HomePage } from "./features/home/HomePage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { PromptLibraryPage } from "./features/library/PromptLibraryPage";
import { ProjectDetailPage } from "./features/projects/ProjectDetailPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AppProvider, useSettings } from "./store/AppContext";

function AppInner() {
  const baseUrl = import.meta.env.BASE_URL;
  const { theme } = useSettings();
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("va_splash_done") === "1"
  );
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem("va_onboarding_done") === "1"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyThemeHead = () => {
      const resolvedTheme = theme === "system"
        ? (media.matches ? "dark" : "light")
        : theme;
      const iconHref = resolvedTheme === "dark"
        ? `${baseUrl}branding/vibesai-logo-dark.jpg`
        : `${baseUrl}branding/vibesai-logo-light.jpg`;

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
  }, [baseUrl, theme]);

  const handleSplashDone = () => {
    sessionStorage.setItem("va_splash_done", "1");
    setSplashDone(true);
  };

  const handleOnboardingDone = () => {
    localStorage.setItem("va_onboarding_done", "1");
    setOnboardingDone(true);
  };

  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (!onboardingDone) {
    return <OnboardingPage onDone={handleOnboardingDone} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/ai-chat" element={<HomePage />} />
        <Route path="/" element={<BuildPage />} />
        <Route path="/builder/:id" element={<BuildPage />} />
        <Route path="/edit/:id" element={<ExpressEditPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/library" element={<PromptLibraryPage />} />
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
