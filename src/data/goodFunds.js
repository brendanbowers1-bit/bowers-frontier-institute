export const settlementRails = [
  {
    id: "rtp-fednow",
    name: "RTP / FedNow",
    label: "Instant bank credit",
    speed: "Minutes",
    walletAccess: "Immediate",
    fee: "Low",
    risk: "Final credit-push payment with no ACH return window.",
    status: "good",
  },
  {
    id: "wire",
    name: "Domestic wire",
    label: "Same-day bank rail",
    speed: "Same business day",
    walletAccess: "Immediate on receipt",
    fee: "Medium",
    risk: "Final once received, with cutoff times and bank fees.",
    status: "good",
  },
  {
    id: "direct-deposit",
    name: "Direct deposit / payroll",
    label: "Settled income rail",
    speed: "On payday",
    walletAccess: "Immediate",
    fee: "Low",
    risk: "Best for recurring BTC or USDC allocation from income.",
    status: "good",
  },
  {
    id: "debit-card",
    name: "Debit card",
    label: "Card-funded purchase",
    speed: "Minutes",
    walletAccess: "Immediate with limits",
    fee: "Higher",
    risk: "Faster consumer access, controlled by lower limits and fraud checks.",
    status: "review",
  },
  {
    id: "ach",
    name: "ACH pull",
    label: "Reversible bank debit",
    speed: "Instant trading credit",
    walletAccess: "Held until cleared",
    fee: "Lowest",
    risk: "Not good funds. User can lock price, but external transfer waits.",
    status: "hold",
  },
];

export const productSteps = [
  {
    eyebrow: "Verify",
    title: "Know the customer before money moves.",
    body: "Identity, sanctions, fraud signals, device trust, and wallet-risk checks run before a rail is even offered.",
  },
  {
    eyebrow: "Route",
    title: "Show only honest settlement options.",
    body: "The app separates instant availability from final settlement, then routes users to RTP, FedNow, wire, card, direct deposit, or ACH with a clear hold.",
  },
  {
    eyebrow: "Convert",
    title: "Execute against a quoted spread.",
    body: "Users choose BTC or USDC, see the final amount, network, fees, and exact delivery terms before confirming.",
  },
  {
    eyebrow: "Release",
    title: "Send to self-custody when funds are good.",
    body: "If the rail is final, crypto leaves immediately. If the rail is reversible, the app gives a timestamped unlock instead of hiding the hold.",
  },
];

export const customerSegments = [
  {
    name: "Self-custody buyers",
    pain: "They can buy instantly, but cannot actually withdraw for days.",
    promise: "Use good funds and receive BTC or USDC in their own wallet today.",
  },
  {
    name: "Contractor payout teams",
    pain: "Payroll, bank wires, and stablecoin payouts live in separate systems.",
    promise: "Route approved payouts from bank funds to wallet addresses with a compliance trail.",
  },
  {
    name: "Crypto operators",
    pain: "Treasury teams need proof of source funds and exact delivery status.",
    promise: "A bank-to-wallet log that shows rail, settlement state, wallet screening, and network hash.",
  },
];

export const guardrails = [
  "No marketing claim that ACH is settled instantly.",
  "No release to external wallets until reversible funding risk is covered.",
  "Per-user limits increase only with verified funding history.",
  "Wallet screening and sanctions controls before every withdrawal.",
  "Plain-language disclosures for network fees, failed deposits, and irreversible transfers.",
];

export const faqs = [
  {
    question: "Why not just use ACH?",
    answer:
      "ACH is cheap, but reversible. GoodFunds can let a user lock a quote with ACH, but the external wallet transfer stays held until the funds are actually good.",
  },
  {
    question: "Is this an exchange?",
    answer:
      "The MVP is better framed as a settlement-aware on-ramp. Liquidity, custody, banking, and licensing can start through regulated partners while the product owns routing, disclosures, and the user experience.",
  },
  {
    question: "What makes it defensible?",
    answer:
      "The product compounds trust data: verified funding history, rail availability, device integrity, wallet-risk outcomes, and settlement behavior. That lets limits grow safely without pretending every rail has the same risk.",
  },
  {
    question: "What ships first?",
    answer:
      "A consumer web app that quotes BTC and USDC delivery by rail, supports wallet address entry, and makes settlement status impossible to misunderstand.",
  },
];
