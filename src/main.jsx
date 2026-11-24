import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.jsx";
import { LocaleProvider } from "./i18n/LocaleContext.jsx";
import { registerServiceWorker } from "./registerServiceWorker.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LocaleProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </LocaleProvider>
  </StrictMode>,
);

registerServiceWorker();
