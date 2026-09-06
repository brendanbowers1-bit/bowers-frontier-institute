import { Component } from "react";

export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="br3n-loader" role="alert">
          <div className="br3n-loader-card">
            <p>Dashboard unavailable. Refresh to retry.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
