import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { LocaleProvider } from "./i18n/LocaleContext.jsx";
import { FalsificationRegistry } from "./components/FalsificationRegistry.jsx";
import { registerServiceWorker } from "./registerServiceWorker.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LocaleProvider>
      <FalsificationRegistry />
    </LocaleProvider>
  </StrictMode>,
);

registerServiceWorker();
