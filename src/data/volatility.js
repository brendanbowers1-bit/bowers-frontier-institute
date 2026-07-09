export const volatilitySeries = Array.from({ length: 90 }, (_, index) => {
  const realized = 7.8 + Math.sin(index / 8) * 1.1 + Math.cos(index / 15) * 0.7;
  const implied = 8.6 + Math.sin(index / 9 + 0.8) * 1.3 + Math.cos(index / 18) * 0.9;
  return {
    day: index + 1,
    realized: Number(realized.toFixed(2)),
    implied: Number(implied.toFixed(2)),
  };
});

export const ohlcSeries = Array.from({ length: 42 }, (_, index) => {
  const mid = 1.085 + index * 0.0012 + Math.sin(index / 5) * 0.008;
  const spread = 0.006 + Math.abs(Math.cos(index / 4)) * 0.005;
  const open = mid - Math.sin(index / 3) * 0.003;
  const close = mid + Math.cos(index / 4) * 0.003;
  return {
    session: index + 1,
    open: Number(open.toFixed(4)),
    high: Number((Math.max(open, close) + spread).toFixed(4)),
    low: Number((Math.min(open, close) - spread).toFixed(4)),
    close: Number(close.toFixed(4)),
  };
});
