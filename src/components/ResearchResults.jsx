import hypothesesDoc from "../../data/research/hypotheses.json";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { ResearchChrome } from "./ResearchChrome.jsx";
import { ResearchStructuredData } from "./ResearchStructuredData.jsx";
import "./ResearchResults.css";

export function ResearchResults() {
  const { t } = useLocale();
  const hypotheses = hypothesesDoc.hypotheses ?? [];

  return (
    <ResearchChrome current="research" structuredData={<ResearchStructuredData />}>
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
    </ResearchChrome>
  );
}
