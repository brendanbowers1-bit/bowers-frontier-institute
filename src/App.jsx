import { Br3nDashboard } from "./components/Br3nDashboard";
import { Br3nMobileApp } from "./components/Br3nMobileApp";

export default function App() {
  if (window.location.pathname.startsWith("/mobile")) {
    return <Br3nMobileApp />;
  }

  return <Br3nDashboard />;
}
