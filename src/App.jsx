import { useEffect, useState } from "react";
import { Br3nDashboard } from "./components/Br3nDashboard";
import { GoodFundsLanding } from "./components/GoodFundsLanding";

function getHashRoute() {
  return window.location.hash.replace("#", "");
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "dashboard") {
    return <Br3nDashboard />;
  }

  return <GoodFundsLanding />;
}
