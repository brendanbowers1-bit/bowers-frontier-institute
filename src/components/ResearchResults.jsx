import { useMemo } from "react";
import hypothesesDoc from "../../data/research/hypotheses.json";
import { dashboardHref } from "../i18n/messages.js";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { LocaleSwitcher } from "./LocaleSwitcher.jsx";
import { Br3nCrest } from "./Br3nCrest.jsx";
import { ResearchStructuredData } from "./ResearchStructuredData.jsx";
import "./ResearchResults.css";

export function ResearchResults() {
  const { t, locale } = useLocale();
  const dashboardUrl = useMemo(() => {
    const href = dashboardHref(import.meta.env.BASE_URL);
    return `${href}?lang=${encodeURIComponent(locale)}`;
  }, [locale]);

  const hypotheses = hypothesesDoc.hypotheses ?? [];

  return (
    <div className="research-page">
      <ResearchStructuredData />
      <header className="research-top">
        <a className="research-brand" href={dashboardUrl}>
          <Br3nCrest compact />
          <span>
            <strong>{t("brand.wordmark", "BR3N")}</strong>
            <em>{t("brand.line", "Macro Labs")}</em>
          </span>
        </a>
        <nav className="research-nav" aria-label={t("nav.research", "Research")}>
          <a href={dashboardUrl}>{t("nav.dashboard", "Dashboard")}</a>
          <a aria-current="page" href="#research-results">
            {t("nav.research", "Research")}
          </a>
        </nav>
        <LocaleSwitcher />
      </header>

      <main className="research-main" id="research-results" tabIndex={-1}>
        <p className="research-kicker">{t("research.kicker", "Paper / research only")}</p>
        <h1>{t("research.title", "Pre-registered hypotheses and verdicts")}</h1>
        <p className="research-lede">{t("research.lede")}</p>
        <p className="research-flags">
          {t("disclosure.noExecution", "No execution surface · research only")} ·{" "}
          {t("disclosure.mockData", "Mock data · no live feeds")}
        </p>

        {hypotheses.length === 0 ? (
          <p>{t("research.empty", "No hypotheses published.")}</p>
        ) : (
          <ol className="research-list">
            {hypotheses.map((item) => (
              <li className="research-card" key={item.id}>
                <div className="research-card-head">
                  <h2>{item.title}</h2>
                  <span className={`research-status is-${item.status}`}>
                    {item.status === "falsified"
                      ? t("research.statusFalsified", "Falsified")
                      : t("research.statusOpen", "Open")}
                  </span>
                </div>
                <dl className="research-meta">
                  <div>
                    <dt>{t("research.lab", "Lab")}</dt>
                    <dd>{item.lab}</dd>
                  </div>
                  <div>
                    <dt>{t("research.sample", "n")}</dt>
                    <dd>{Number(item.n).toLocaleString("en-US")}</dd>
                  </div>
                  <div>
                    <dt>{t("research.sourcePr", "Source PR")}</dt>
                    <dd>
                      <a href={item.prUrl} rel="noreferrer noopener" target="_blank">
                        {item.prLabel}
                      </a>
                    </dd>
                  </div>
                </dl>
                <h3>{t("research.hypothesis", "Hypothesis")}</h3>
                <p>{item.hypothesis}</p>
                <h3>{t("research.holdout", "Holdout")}</h3>
                <p>{item.holdout}</p>
                <h3>{t("research.metrics", "Holdout metrics")}</h3>
                <ul className="research-metrics">
                  {(item.metrics ?? []).map((metric) => (
                    <li key={`${item.id}-${metric.label}`}>
                      <strong>{metric.value}</strong>
                      <span>{metric.label}</span>
                      {metric.detail ? <em>{metric.detail}</em> : null}
                    </li>
                  ))}
                </ul>
                <h3>{t("research.verdict", "Verdict")}</h3>
                <p className="research-verdict">{item.verdict}</p>
                {item.registrationHash ? (
                  <p className="research-hash">
                    {t("research.hash", "Registration hash")}: {item.registrationHash}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </main>

      <footer className="research-footer">
        <a href={dashboardUrl}>{t("research.back", "Back to dashboard")}</a>
        <p>{t("disclosure.footer")}</p>
      </footer>
    </div>
  );
}
