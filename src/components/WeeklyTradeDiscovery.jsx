import {
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
      </div>
    </section>
  );
}
