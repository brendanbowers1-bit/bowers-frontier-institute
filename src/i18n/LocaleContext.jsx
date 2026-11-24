/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  catalogs,
  DEFAULT_LOCALE,
  isFalsificationPath,
  isResearchPath,
  isSupportedLocale,
  STORAGE_KEY,
  translate,
} from "./messages.js";

const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, fallback) => fallback ?? key,
});

function readInitialLocale() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  const fromQuery = new URLSearchParams(window.location.search).get("lang");
  if (isSupportedLocale(fromQuery)) {
    return fromQuery;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLocale(stored)) {
      return stored;
    }
  } catch {
    // Private mode can block localStorage.
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);
  const messages = catalogs[locale] ?? catalogs[DEFAULT_LOCALE];

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore persistence failures.
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("lang") !== locale) {
      params.set("lang", locale);
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}?${query}${window.location.hash}`);
    }

    const research = isResearchPath(window.location.pathname);
    const falsification = isFalsificationPath(window.location.pathname);
    const titleKey = falsification
      ? "meta.falsificationTitle"
      : research
        ? "meta.researchTitle"
        : "meta.dashboardTitle";
    const skipKey = falsification
      ? "skip.falsification"
      : research
        ? "skip.research"
        : "skip.dashboard";
    document.title = translate(messages, titleKey);
    const skip = document.querySelector(".skip-link");
    if (skip) {
      skip.textContent = translate(messages, skipKey);
    }
  }, [locale, messages]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (next) => {
        if (isSupportedLocale(next)) {
          setLocaleState(next);
        }
      },
      t: (key, fallback) => translate(messages, key, fallback),
    }),
    [locale, messages],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
