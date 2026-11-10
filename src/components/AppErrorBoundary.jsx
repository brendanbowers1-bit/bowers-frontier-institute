import { Component } from "react";
import { appVersion, runtimeLog } from "../lib/runtimeLog.js";

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
      return (
        <div className="br3n-loader" role="alert">
          <div className="br3n-loader-card">
            <p>Dashboard unavailable. Refresh to retry.</p>
            <p>Research only. Nothing here executes trades.</p>
            <button
              className="br3n-error-retry"
              onClick={() => this.setState({ hasError: false })}
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
