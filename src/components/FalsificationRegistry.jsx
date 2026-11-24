import registry from "../../data/research/falsification.json";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { FalsificationStructuredData } from "./FalsificationStructuredData.jsx";
import { ResearchChrome } from "./ResearchChrome.jsx";
import "./ResearchResults.css";

const STATUS_KEYS = {
  FALSIFIED: "falsification.statusFalsified",
  "FAIL-N": "falsification.statusFailN",
  UNSCORED: "falsification.statusUnscored",
  PASS: "falsification.statusPass",
};

const STATUS_FALLBACKS = {
  FALSIFIED: "FALSIFIED",
  "FAIL-N": "FAIL-N",
  UNSCORED: "UNSCORED",
  PASS: "PASS",
};

function statusClass(status) {
  return `is-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function FalsificationRegistry() {
  const { t } = useLocale();
  const hypotheses = registry.hypotheses ?? [];
  const counts = registry.statusCounts ?? {};

  return (
    <ResearchChrome current="falsification" structuredData={<FalsificationStructuredData />}>
      <main className="research-main" id="falsification-registry" tabIndex={-1}>
        <p className="research-kicker">{t("falsification.kicker", "Paper / research only")}</p>
        <h1>{t("falsification.title", "Falsification registry")}</h1>
        <p className="research-lede">{t("falsification.lede")}</p>
        <p className="research-flags">
          {t("disclosure.noExecution", "No execution surface · research only")} ·{" "}
          {t("falsification.noEdge", "No trading edge is claimed")}
        </p>

        <ul className="research-status-counts" aria-label={t("falsification.counts", "Registry status counts")}>
          {["FALSIFIED", "FAIL-N", "UNSCORED", "PASS"].map((status) => (
            <li key={status}>
              <strong>{counts[status] ?? 0}</strong>
              <span>{t(STATUS_KEYS[status], STATUS_FALLBACKS[status])}</span>
            </li>
          ))}
        </ul>

        {hypotheses.length === 0 ? (
          <p>{t("falsification.empty", "No falsification rows published.")}</p>
        ) : (
          <ol className="research-list">
            {hypotheses.map((item) => (
              <li className="research-card" key={item.id}>
                <div className="research-card-head">
                  <h2>{item.title}</h2>
                  <span className={`research-status ${statusClass(item.displayStatus)}`}>
                    {t(STATUS_KEYS[item.displayStatus], STATUS_FALLBACKS[item.displayStatus])}
                  </span>
                </div>
                <dl className="research-meta">
                  <div>
                    <dt>{t("research.lab", "Lab")}</dt>
                    <dd>{item.lab}</dd>
                  </div>
                  <div>
                    <dt>{t("research.sample", "n")}</dt>
                    <dd>{item.n == null ? "—" : Number(item.n).toLocaleString("en-US")}</dd>
                  </div>
                  <div>
                    <dt>{t("research.sourcePr", "Source PR")}</dt>
                    <dd>
                      {item.prUrl ? (
                        <a href={item.prUrl} rel="noreferrer noopener" target="_blank">
                          {item.prLabel}
                        </a>
                      ) : (
                        t("falsification.noPr", "No source PR")
                      )}
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
