const pairs = ["EUR/USD", "USD/JPY", "GBP/USD", "USD/CHF", "AUD/USD", "USD/CAD"];

export const fxRates = pairs.map((pair, pairIndex) => {
  const base = [1.086, 157.21, 1.274, 0.893, 0.664, 1.361][pairIndex];
  return {
    pair,
    spot: base,
    change: [0.34, -0.18, 0.21, -0.09, 0.42, -0.14][pairIndex],
    bid: base - base * 0.00008,
    ask: base + base * 0.00008,
    forwardPoints: [36.3, -24.8, 18.1, -9.5, 11.2, 7.8][pairIndex],
  };
});

export const fxPriceSeries = Array.from({ length: 96 }, (_, index) => {
  const wave = Math.sin(index / 7) * 0.005 + Math.cos(index / 13) * 0.003;
  const drift = index * 0.00018;
  return {
    time: `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`,
    eurusd: 1.078 + drift + wave,
    gbpusd: 1.264 + drift * 0.8 + wave * 0.7,
    usdjpy: 156.4 + index * 0.012 + wave * 22,
  };
});
