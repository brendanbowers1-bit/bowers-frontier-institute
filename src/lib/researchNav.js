import { dashboardHref, falsificationHref, researchHref } from "../i18n/messages.js";

export function researchNavItems(baseUrl, locale, current) {
  const lang = `?lang=${encodeURIComponent(locale)}`;
  return [
    {
      id: "dashboard",
      href: `${dashboardHref(baseUrl)}${lang}`,
      key: "nav.dashboard",
      fallback: "Dashboard",
      current: current === "dashboard",
    },
    {
      id: "research",
      href: `${researchHref(baseUrl)}${lang}`,
      key: "nav.research",
      fallback: "Research",
      current: current === "research",
    },
    {
      id: "falsification",
      href: `${falsificationHref(baseUrl)}${lang}`,
      key: "nav.falsification",
      fallback: "Falsification",
      current: current === "falsification",
    },
  ];
}
