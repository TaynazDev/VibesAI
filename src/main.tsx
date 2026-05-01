import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

function setupIOSInputZoomReset() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!(viewport instanceof HTMLMetaElement)) return;

  const defaultViewport = "width=device-width, initial-scale=1.0";
  const focusedViewport = "width=device-width, initial-scale=1.0, maximum-scale=1.0";

  const isTextControl = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return target.matches("input, textarea, select");
  };

  document.addEventListener("focusin", (event) => {
    if (isTextControl(event.target)) {
      viewport.setAttribute("content", focusedViewport);
    }
  });

  document.addEventListener("focusout", (event) => {
    if (isTextControl(event.target)) {
      window.setTimeout(() => {
        viewport.setAttribute("content", defaultViewport);
      }, 120);
    }
  });
}

setupIOSInputZoomReset();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
