import {
  exampleWeeklyTradeNote,
  noTradeGates,
  recommendationScorecard,
  recommendationTiers,
  weeklyTradeDiscovery,
  weeklyTradeOutput,
} from "../data/weeklyTradeDiscovery";

export function WeeklyTradeDiscovery() {
  return (
    <section
      id="weekly-trade"
      className="section section--trade-discovery"
      aria-labelledby="weekly-trade-title"
    >
      <div className="container">
        <div className="trade-discovery__layout">
          <header className="section-header trade-discovery__header">
            <p className="section-label">Weekly trade discovery</p>
            <h2 id="weekly-trade-title" className="section-title">
              Find the best-fit trade for the week.
            </h2>
            <p className="section-lead">
              A disciplined research loop for ranking market setups without
              confusing conviction with certainty.
            </p>
          </header>

          <aside className="trade-discovery__output" aria-label={weeklyTradeOutput.label}>
            <p className="trade-discovery__eyebrow">{weeklyTradeOutput.label}</p>
            <h3>{weeklyTradeOutput.title}</h3>
            <p>{weeklyTradeOutput.body}</p>
            <ul>
              {weeklyTradeOutput.fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </aside>
        </div>

        <ol className="trade-process">
          {weeklyTradeDiscovery.map((item) => (
            <li key={item.id}>
              <article className="trade-process__card">
                <span className="trade-process__step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <ul aria-label={`${item.title} signals`}>
                  {item.signals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>

        <div
          className="recommendation-system"
          aria-labelledby="recommendation-system-title"
        >
          <div className="recommendation-system__intro">
            <p className="section-label">Recommendation quality</p>
            <h3 id="recommendation-system-title">
              A trade only earns recommendation status after scoring and gates.
            </h3>
          </div>

          <div className="recommendation-system__grid">
            <article className="recommendation-card recommendation-card--score">
              <h4>Weighted scorecard</h4>
              <ul className="scorecard-list">
                {recommendationScorecard.map((metric) => (
                  <li key={metric.id}>
                    <div className="scorecard-list__header">
                      <span>{metric.label}</span>
                      <strong>{metric.weight}</strong>
                    </div>
                    <p>{metric.description}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="recommendation-card">
              <h4>Recommendation tiers</h4>
              <ol className="tier-list">
                {recommendationTiers.map((tier) => (
                  <li key={tier.id}>
                    <span className="tier-list__score">{tier.score}</span>
                    <div>
                      <h5>{tier.name}</h5>
                      <p>{tier.guidance}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="recommendation-card recommendation-card--gates">
              <h4>Hard no-trade gates</h4>
              <ul className="gate-list">
                {noTradeGates.map((gate) => (
                  <li key={gate}>{gate}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>

        <article className="example-trade-note" aria-labelledby="example-trade-title">
          <div className="example-trade-note__header">
            <p className="section-label">{exampleWeeklyTradeNote.label}</p>
            <div>
              <h3 id="example-trade-title">{exampleWeeklyTradeNote.setup}</h3>
              <p>{exampleWeeklyTradeNote.summary}</p>
            </div>
            <div className="example-trade-note__grade" aria-label="Example score">
              <span>{exampleWeeklyTradeNote.tier}</span>
              <strong>{exampleWeeklyTradeNote.score}/100</strong>
            </div>
          </div>

          <div className="example-trade-note__grid">
            <section aria-labelledby="example-score-title">
              <h4 id="example-score-title">Score breakdown</h4>
              <ul className="example-score-list">
                {exampleWeeklyTradeNote.breakdown.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>
                      {item.score}/{item.max}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="example-note-title">
              <h4 id="example-note-title">Research note</h4>
              <dl className="example-note-list">
                <div>
                  <dt>Thesis</dt>
                  <dd>{exampleWeeklyTradeNote.thesis}</dd>
                </div>
                <div>
                  <dt>Entry logic</dt>
                  <dd>{exampleWeeklyTradeNote.entryLogic}</dd>
                </div>
                <div>
                  <dt>Invalidation</dt>
                  <dd>{exampleWeeklyTradeNote.invalidation}</dd>
                </div>
                <div>
                  <dt>Risk budget</dt>
                  <dd>{exampleWeeklyTradeNote.riskBudget}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="example-gates-title">
              <h4 id="example-gates-title">No-trade triggers</h4>
              <ul className="gate-list">
                {exampleWeeklyTradeNote.noTradeTriggers.map((trigger) => (
                  <li key={trigger}>{trigger}</li>
                ))}
              </ul>
            </section>
          </div>

          <p className="example-trade-note__recommendation">
            <strong>Recommendation:</strong> {exampleWeeklyTradeNote.recommendation}
          </p>
        </article>
      </div>
    </section>
  );
}
