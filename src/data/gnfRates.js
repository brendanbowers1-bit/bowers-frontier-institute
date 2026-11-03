export const bcrgGnfFallback = {
  asOf: "2026-07-23",
  source: "Banque Centrale de la Republique de Guinee (BCRG)",
  sourceUrl: "https://www.bcrg-guinee.org/wp-content/uploads/2026/07/COURS-DE-REFERENCE-BCRG-DU-23-07-2026.pdf",
  officialPostUrl: "https://www.bcrg-guinee.org/cours_des_devises/fixing-du-23-07-2026/",
  degraded: false,
  rates: [
    { name: "Droits de Tirage Speciaux", code: "DTS", rate: 11881.823 },
    { name: "Dollar Des USA", code: "USD", rate: 8753.4816 },
    { name: "EURO", code: "EUR", rate: 9985.9712 },
    { name: "Yuan Chinois", code: "CNY", rate: 1292.0651 },
    { name: "Dollar Canadien", code: "CAD", rate: 6204.486 },
    { name: "Livre Sterling", code: "GBP", rate: 11704.7125 },
    { name: "Franc Suisse", code: "CHF", rate: 10772.1914 },
    { name: "Yen Japonais", code: "JPY", rate: 53.653 },
    { name: "Couronne Danoise", code: "DKK", rate: 1335.8021 },
    { name: "Couronne Norvegienne", code: "NOK", rate: 908.8311 },
    { name: "Couronne Suedoise", code: "SEK", rate: 903.7695 },
    { name: "Ryal Saoudien", code: "SAR", rate: 2334.2673 },
    { name: "Franc Cfa Ouest Africain", code: "XOF", rate: 15.2313 },
  ],
};

export function findBcrgRate(feed, code) {
  return feed?.rates?.find((rate) => rate.code === code) ?? null;
}
