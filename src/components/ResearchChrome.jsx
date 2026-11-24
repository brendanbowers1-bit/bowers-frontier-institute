import { Br3nCrest } from "./Br3nCrest.jsx";
import { LocaleSwitcher } from "./LocaleSwitcher.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { researchNavItems } from "../lib/researchNav.js";

export function ResearchChrome({ current, structuredData, children }) {
  const { t, locale } = useLocale();
  const items = researchNavItems(import.meta.env.BASE_URL, locale, current);
  const dashboardUrl = items[0].href;

  return (
    <div className="research-page">
      {structuredData}
      <header className="research-top">
        <a className="research-brand" href={dashboardUrl}>
          <Br3nCrest compact />
          <span>
            <strong>{t("brand.wordmark", "BR3N")}</strong>
            <em>{t("brand.line", "Macro Labs")}</em>
          </span>
        </a>
        <nav className="research-nav" aria-label={t("nav.research", "Research")}>
          {items.map((item) => (
            <a aria-current={item.current ? "page" : undefined} href={item.href} key={item.id}>
              {t(item.key, item.fallback)}
            </a>
          ))}
        </nav>
        <LocaleSwitcher />
      </header>
      {children}
      <footer className="research-footer">
        <a href={dashboardUrl}>{t("research.back", "Back to dashboard")}</a>
        <p>{t("disclosure.footer")}</p>
      </footer>
    </div>
  );
}
