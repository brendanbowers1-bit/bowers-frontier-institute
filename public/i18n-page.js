(async function applyPageLocale() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("lang") || window.localStorage.getItem("bfi-locale") || "en";
  const locale = requested === "pt-PT" ? "pt-PT" : "en";
  document.documentElement.lang = locale;

  let catalogs;
  try {
    const response = await fetch("./i18n/page-strings.json", { cache: "no-store" });
    catalogs = await response.json();
  } catch {
    return;
  }

  const trades = catalogs[locale]?.trades;
  if (!trades) {
    return;
  }

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = trades[node.dataset.i18n];
    if (typeof value === "string") {
      node.textContent = value;
    }
  });

  if (trades.title) {
    document.title = trades.title;
  }

  const localeCatalog = catalogs[locale]?.locale;
  document.querySelectorAll("[data-i18n-locale]").forEach((node) => {
    const value = localeCatalog?.[node.dataset.i18nLocale];
    if (typeof value === "string") {
      node.textContent = value;
    }
  });
})();
