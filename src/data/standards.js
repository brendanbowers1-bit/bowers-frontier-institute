export const standards = [
  {
    id: "provenance",
    title: "Data provenance",
    detail: "Lineage from source ingestion through transformation and publication.",
    tier: "foundation",
  },
  {
    id: "fair",
    title: "FAIR / CARE principles",
    detail: "Findable, accessible, interoperable data with collective benefit safeguards.",
    tier: "foundation",
  },
  {
    id: "validation",
    title: "Model validation",
    detail: "Held-out evaluation, stress scenarios, and domain benchmarks.",
    tier: "foundation",
  },
  {
    id: "reproducibility",
    title: "Reproducibility",
    detail: "Versioned datasets, documented pipelines, experiment manifests.",
    tier: "foundation",
  },
  {
    id: "bias",
    title: "Bias review",
    detail: "Audits across demographic, geographic, and temporal representation.",
    tier: "governance",
  },
  {
    id: "audit",
    title: "Audit trails",
    detail: "Immutable logs for model decisions, data access, and governance.",
    tier: "governance",
  },
  {
    id: "versioned",
    title: "Versioned datasets",
    detail: "Immutable dataset versions with explicit schema and change history.",
    tier: "operations",
  },
  {
    id: "baseline",
    title: "Baseline comparisons",
    detail: "Documented baselines before any performance or impact claim.",
    tier: "operations",
  },
  {
    id: "uncertainty",
    title: "Uncertainty reporting",
    detail: "Intervals, sensitivity analysis, and known limitation disclosure.",
    tier: "operations",
  },
  {
    id: "human",
    title: "Human approval for high-risk claims",
    detail: "Explicit review gates before external or high-stakes assertions.",
    tier: "governance",
  },
];
