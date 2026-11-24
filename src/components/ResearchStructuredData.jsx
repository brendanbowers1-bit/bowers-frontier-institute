import hypothesesDoc from "../../data/research/hypotheses.json";

const PAGE_URL = "https://brendanbowers1-bit.github.io/bowers-frontier-institute/research.html";
const IMAGE = "https://brendanbowers1-bit.github.io/bowers-frontier-institute/social-card.png";

export function ResearchStructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ResearchProject",
        "@id": `${PAGE_URL}#project`,
        name: "Bowers Frontier Institute lab holdouts",
        description: hypothesesDoc.disclaimer,
        url: PAGE_URL,
        image: IMAGE,
        keywords: "paper research only, no trading signals, falsified hypotheses",
      },
      {
        "@type": "Dataset",
        "@id": `${PAGE_URL}#dataset`,
        name: "Pinned lab hypothesis registry",
        description: "Vendored, schema-validated holdout verdicts. No live fetch at runtime.",
        url: PAGE_URL,
        image: IMAGE,
        license: "https://github.com/brendanbowers1-bit/bowers-frontier-institute",
        isAccessibleForFree: true,
        variableMeasured: (hypothesesDoc.hypotheses ?? []).map((item) => item.title),
        creator: { "@type": "Organization", name: "Bowers Frontier Institute" },
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
