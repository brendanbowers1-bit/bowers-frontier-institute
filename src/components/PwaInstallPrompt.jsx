import { useEffect, useMemo, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

const STORAGE_KEY = "br3n-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(STORAGE_KEY) === "true");
  const [installed, setInstalled] = useState(() => window.matchMedia?.("(display-mode: standalone)").matches ?? false);

  const isiOS = useMemo(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent), []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (dismissed || installed || (!installEvent && !isiOS)) return null;

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <aside className="br3n-install-prompt" aria-label="Install app prompt">
      <div>
        <Smartphone size={17} />
        <span>Publish-ready mobile app</span>
        <strong>Add BR3N Cockpit to your home screen.</strong>
        <p>
          {isiOS
            ? "On iPhone, tap Share, then Add to Home Screen for a standalone app experience."
            : "Install the app for a full-screen dashboard, fast reloads, and offline shell support."}
        </p>
      </div>
      <div className="br3n-install-actions">
        {installEvent ? (
          <button onClick={install} type="button">
            <Download size={14} />
            Install
          </button>
        ) : (
          <span>
            <Share size={14} />
            Share → Add to Home Screen
          </span>
        )}
        <button aria-label="Dismiss install prompt" onClick={dismiss} type="button">
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}
