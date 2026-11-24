import { SUPPORTED_LOCALES } from "../i18n/messages.js";
import { useLocale } from "../i18n/LocaleContext.jsx";
import "./LocaleSwitcher.css";

const LABELS = {
  en: "English",
  "pt-PT": "Português",
};

export function LocaleSwitcher({ className = "" }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className={`locale-switcher ${className}`.trim()} role="group" aria-label={t("locale.switcher", "Language")}>
      {SUPPORTED_LOCALES.map((code) => (
        <button
          aria-pressed={locale === code}
          className={locale === code ? "is-active" : ""}
          key={code}
          lang={code}
          onClick={() => setLocale(code)}
          type="button"
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
