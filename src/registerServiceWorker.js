import { appVersion, runtimeLog } from "./lib/runtimeLog.js";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const serviceWorkerUrl = `${baseUrl}service-worker.js?base=${encodeURIComponent(baseUrl)}&v=${encodeURIComponent(
      import.meta.env.VITE_APP_VERSION,
    )}`;

    navigator.serviceWorker.register(serviceWorkerUrl, { scope: baseUrl }).catch((error) => {
      runtimeLog.error("service_worker_register", error, { version: appVersion() });
    });
  });
}
