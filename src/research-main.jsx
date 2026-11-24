import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { LocaleProvider } from "./i18n/LocaleContext.jsx";
import { ResearchResults } from "./components/ResearchResults.jsx";
import { registerServiceWorker } from "./registerServiceWorker.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LocaleProvider>
      <ResearchResults />
    </LocaleProvider>
  </StrictMode>,
);

registerServiceWorker();
