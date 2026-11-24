import { Component } from "react";
import { appVersion, runtimeLog } from "../lib/runtimeLog.js";
import { useLocale } from "../i18n/LocaleContext.jsx";

export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    runtimeLog.error("dashboard_render", error, { version: appVersion() });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ onRetry }) {
  const { t } = useLocale();
  return (
    <div className="br3n-loader" role="alert">
      <div className="br3n-loader-card">
        <p>{t("error.title", "Dashboard unavailable. Refresh to retry.")}</p>
        <p>{t("error.researchOnly", "Research only. Nothing here executes trades.")}</p>
        <button className="br3n-error-retry" onClick={onRetry} type="button">
          {t("error.retry", "Retry")}
        </button>
      </div>
    </div>
  );
}
