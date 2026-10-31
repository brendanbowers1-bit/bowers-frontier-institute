import { useEffect, useState } from "react";
import { Br3nDashboard } from "./components/Br3nDashboard";
import { GoodFundsLanding } from "./components/GoodFundsLanding";
import { ResumePage } from "./components/ResumePage";

const goodFundsAnchors = new Set(["overview", "rails", "product", "pilot"]);

function getHashRoute(previousRoute = "resume") {
  const route = window.location.hash.replace(/^#\/?/, "").split("/")[0];

  if (route === "dashboard" || route === "goodfunds") {
    return route;
  }

  if (previousRoute === "goodfunds" && goodFundsAnchors.has(route)) {
    return "goodfunds";
  }

  return "resume";
}

export default function App() {
  const [route, setRoute] = useState(() => getHashRoute());

  useEffect(() => {
    const handleHashChange = () => setRoute((currentRoute) => getHashRoute(currentRoute));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "dashboard") {
    return <Br3nDashboard />;
  }

  if (route === "goodfunds") {
    return <GoodFundsLanding />;
  }

  return <ResumePage />;
}
