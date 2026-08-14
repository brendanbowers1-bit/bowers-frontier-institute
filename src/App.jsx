import { useEffect, useState } from "react";
import { Br3nDashboard } from "./components/Br3nDashboard";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Labs } from "./components/Labs";
import { Mission } from "./components/Mission";
import { ResearchStandards } from "./components/ResearchStandards";
import { WeeklyTradeDiscovery } from "./components/WeeklyTradeDiscovery";
import { WhatWeDo } from "./components/WhatWeDo";

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (hash === "#dashboard") {
    return (
      <div className="dashboard-view">
        <a className="dashboard-return" href="#top">
          Back to institute
        </a>
        <Br3nDashboard />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Mission />
        <WhatWeDo />
        <DashboardGateway />
        <WeeklyTradeDiscovery />
        <Labs />
        <ResearchStandards />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

function DashboardGateway() {
  return (
    <section id="dashboard-preview" className="section dashboard-gateway" aria-labelledby="dashboard-preview-title">
      <div className="container dashboard-gateway__inner">
        <div className="dashboard-gateway__copy">
          <p className="section-label">Finance cockpit</p>
          <h2 id="dashboard-preview-title" className="section-title">
            A dedicated command surface for market oversight.
          </h2>
          <p className="section-lead">
            The BR3N dashboard connects research signals, FX rates, credit-collar candidates,
            volatility, and hedge posture into one focused operating view.
          </p>
        </div>
        <div className="dashboard-gateway__panel" aria-label="Dashboard capabilities">
          <span>BR3N Macro Labs</span>
          <strong>Signal engine online</strong>
          <ul>
            <li>Credit collars ranked by risk/reward gates</li>
            <li>Currency exposure and hedge posture monitoring</li>
            <li>Market curves, volatility, and drawdown context</li>
          </ul>
          <a className="btn btn--primary" href="#dashboard">
            Open dashboard
          </a>
        </div>
      </div>
    </section>
  );
}
