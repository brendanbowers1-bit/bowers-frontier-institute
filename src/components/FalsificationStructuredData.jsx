import registry from "../../data/research/falsification.json";

const PAGE_URL = "https://brendanbowers1-bit.github.io/bowers-frontier-institute/falsification.html";
const IMAGE = "https://brendanbowers1-bit.github.io/bowers-frontier-institute/social-card.png";

export function FalsificationStructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ResearchProject",
        "@id": `${PAGE_URL}#project`,
        name: "Bowers Frontier Institute falsification registry",
        description: registry.disclaimer,
        url: PAGE_URL,
        image: IMAGE,
        keywords: "paper research only, falsification registry, no trading edge, no trading signals",
      },
      {
        "@type": "Dataset",
        "@id": `${PAGE_URL}#dataset`,
        name: "Pinned falsification registry v1",
        description:
          "Vendored Arb registry.v1.json plus finance lab registry. Statuses are FALSIFIED, FAIL-N, UNSCORED, or PASS. PASS is not a trading edge.",
        url: PAGE_URL,
        image: IMAGE,
        license: "https://github.com/brendanbowers1-bit/bowers-frontier-institute",
        isAccessibleForFree: true,
        variableMeasured: (registry.hypotheses ?? []).map((item) => item.title),
        creator: { "@type": "Organization", name: "Bowers Frontier Institute" },
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
