const assetProfiles = {
  FX: { start: 100, drift: 0.18, amplitude: 2.4 },
  Equities: { start: 100, drift: 0.32, amplitude: 3.8 },
  Rates: { start: 100, drift: 0.09, amplitude: 1.7 },
  Crypto: { start: 100, drift: 0.52, amplitude: 7.2 },
  Commodities: { start: 100, drift: 0.21, amplitude: 3.1 },
};

export const periods = ["1D", "5D", "1M", "3M", "YTD", "1Y"];

export const assetClasses = Object.keys(assetProfiles);

export const portfolioPerformance = Object.fromEntries(
  Object.entries(assetProfiles).map(([assetClass, profile]) => [
    assetClass,
    Array.from({ length: 160 }, (_, index) => {
      const value =
        profile.start +
        index * profile.drift +
        Math.sin(index / 6) * profile.amplitude +
        Math.cos(index / 19) * profile.amplitude * 0.55;
      return {
        session: index + 1,
        label: `D${index + 1}`,
        value: Number(value.toFixed(2)),
        benchmark: Number((100 + index * profile.drift * 0.72 + Math.sin(index / 11) * profile.amplitude * 0.8).toFixed(2)),
      };
    }),
  ]),
);

export const pnlCurve = portfolioPerformance.FX.map((point, index) => ({
  ...point,
  pnl: Number(((point.value - 100) * 125000).toFixed(0)),
  drawdown: Number((-Math.max(0, Math.sin(index / 9) * 1.8 + Math.cos(index / 17) * 0.8)).toFixed(2)),
}));
