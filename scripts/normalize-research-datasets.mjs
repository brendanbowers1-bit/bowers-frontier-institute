import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const rawRoot = join(process.cwd(), "data", "raw");
const processedRoot = join(process.cwd(), "data", "processed");
const moatSummaryPath = join(process.cwd(), "src", "data", "dataMoat.json");

const cryptoPairs = [
  { symbol: "BTC", resultKey: "XXBTZUSD", slug: "btcusd" },
  { symbol: "ETH", resultKey: "XETHZUSD", slug: "ethusd" },
  { symbol: "SOL", resultKey: "SOLUSD", slug: "solusd" },
];

const etfSymbols = ["SPY", "QQQ", "IWM", "GLD", "TLT", "UUP"];
const optionSymbols = ["SPY", "QQQ", "GLD", "TLT"];
const secCompanies = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "GOOGL",
  "META",
  "JPM",
  "COIN",
  "MSTR",
];

const headers = {
  cryptoOhlc: ["symbol", "interval", "timestamp", "date", "open", "high", "low", "close", "vwap", "volume", "trades", "source"],
  orderbook: ["symbol", "side", "level", "price", "size", "timestamp", "source"],
  trades: ["symbol", "trade_id", "timestamp", "date", "side", "order_type", "price", "size", "source"],
  etfPrices: ["symbol", "date", "open", "high", "low", "close", "volume", "return_1d_pct", "source"],
  treasury: ["date", "tenor", "rate", "source"],
  sofr: ["date", "rate", "percentile_1", "percentile_25", "percentile_75", "percentile_99", "source"],
  macro: ["series", "date", "period", "value", "source"],
  options: ["symbol", "timestamp", "expiration", "type", "contract_count", "avg_bid", "avg_ask", "total_volume", "source"],
  sec: ["ticker", "entity_name", "cik", "latest_filing_date", "recent_filing_count", "companyfacts_concepts", "source"],
  futures: ["symbol", "last", "mark_price", "bid", "ask", "volume", "open_interest", "source"],
};

const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
};

const toCsv = (columns, rows) => [
  columns.join(","),
  ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
].join("\n");

async function latestRawDir() {
  const entries = await readdir(rawRoot, { withFileTypes: true });
  const dates = entries
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  if (dates.length === 0) {
    throw new Error("No data/raw/YYYY-MM-DD directory found. Run npm run data:fetch first.");
  }

  const runDate = dates.at(-1);
  return { rawDir: join(rawRoot, runDate), runDate };
}

async function readJson(rawDir, filename) {
  return JSON.parse(await readFile(join(rawDir, filename), "utf8"));
}

async function readText(rawDir, filename) {
  return readFile(join(rawDir, filename), "utf8");
}

async function writeCsv(outputDir, filename, columns, rows) {
  await writeFile(join(outputDir, filename), `${toCsv(columns, rows)}\n`);
  return {
    filename,
    rows: rows.length,
    columns: columns.length,
  };
}

function normalizeOhlc(data, symbol, interval) {
  const rows = data.result[Object.keys(data.result).find((key) => key !== "last")] ?? [];
  return rows.map((row) => ({
    symbol,
    interval,
    timestamp: row[0],
    date: new Date(row[0] * 1000).toISOString(),
    open: numberOrNull(row[1]),
    high: numberOrNull(row[2]),
    low: numberOrNull(row[3]),
    close: numberOrNull(row[4]),
    vwap: numberOrNull(row[5]),
    volume: numberOrNull(row[6]),
    trades: numberOrNull(row[7]),
    source: "Kraken",
  }));
}

function normalizeOrderbook(data, symbol) {
  const book = Object.values(data.result)[0];
  return ["asks", "bids"].flatMap((side) =>
    book[side].map((level, index) => ({
      symbol,
      side: side === "asks" ? "ask" : "bid",
      level: index + 1,
      price: numberOrNull(level[0]),
      size: numberOrNull(level[1]),
      timestamp: level[2],
      source: "Kraken",
    })),
  );
}

function normalizeTrades(data, symbol) {
  const trades = data.result[Object.keys(data.result).find((key) => key !== "last")] ?? [];
  return trades.map((trade) => ({
    symbol,
    trade_id: trade[6] ?? "",
    timestamp: trade[2],
    date: new Date(trade[2] * 1000).toISOString(),
    side: trade[3] === "b" ? "buy" : "sell",
    order_type: trade[4] === "m" ? "market" : "limit",
    price: numberOrNull(trade[0]),
    size: numberOrNull(trade[1]),
    source: "Kraken",
  }));
}

function normalizeEtf(data, symbol) {
  const result = data.chart.result[0];
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators.quote[0];
  const rows = timestamps.map((timestamp, index) => ({
    symbol,
    date: new Date(timestamp * 1000).toISOString().slice(0, 10),
    open: quote.open[index],
    high: quote.high[index],
    low: quote.low[index],
    close: quote.close[index],
    volume: quote.volume[index],
    return_1d_pct: null,
    source: "Yahoo Finance",
  })).filter((row) => Number.isFinite(row.close));

  return rows.map((row, index) => ({
    ...row,
    return_1d_pct:
      index > 0 && Number.isFinite(rows[index - 1].close) && rows[index - 1].close !== 0
        ? ((row.close - rows[index - 1].close) / rows[index - 1].close) * 100
        : null,
  }));
}

function parseTreasury(csv) {
  const [headerLine, ...lines] = csv.trim().split("\n");
  const columns = headerLine.split(",").map((column) => column.replaceAll('"', ""));
  return lines.flatMap((line) => {
    const values = line.split(",").map((value) => value.replaceAll('"', ""));
    const record = Object.fromEntries(columns.map((column, index) => [column, values[index]]));
    return columns.slice(1).map((tenor) => ({
      date: record.Date,
      tenor,
      rate: numberOrNull(record[tenor]),
      source: "U.S. Treasury",
    }));
  });
}

function normalizeSofr(data) {
  return data.refRates.map((row) => ({
    date: row.effectiveDate,
    rate: row.percentRate,
    percentile_1: row.percentPercentile1,
    percentile_25: row.percentPercentile25,
    percentile_75: row.percentPercentile75,
    percentile_99: row.percentPercentile99,
    source: "New York Fed",
  }));
}

function normalizeBls(data, series) {
  return data.Results.series[0].data.map((row) => ({
    series,
    date: `${row.year}-${row.period.replace("M", "").padStart(2, "0")}`,
    period: row.periodName,
    value: numberOrNull(row.value),
    source: "BLS",
  }));
}

function parseOption(optionSymbol) {
  const match = optionSymbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) {
    return { expiration: "", type: "unknown" };
  }

  const [, , yymmdd, optionType] = match;
  const year = Number(`20${yymmdd.slice(0, 2)}`);
  const month = yymmdd.slice(2, 4);
  const day = yymmdd.slice(4, 6);
  return {
    expiration: `${year}-${month}-${day}`,
    type: optionType === "C" ? "call" : "put",
  };
}

function normalizeOptions(data, symbol) {
  const groups = new Map();
  for (const option of data.data.options) {
    const parsed = parseOption(option.option);
    const key = `${parsed.expiration}|${parsed.type}`;
    const current = groups.get(key) ?? {
      symbol,
      timestamp: data.timestamp,
      expiration: parsed.expiration,
      type: parsed.type,
      contract_count: 0,
      bid_total: 0,
      ask_total: 0,
      total_volume: 0,
      source: "Cboe delayed quotes",
    };

    current.contract_count += 1;
    current.bid_total += numberOrNull(option.bid) ?? 0;
    current.ask_total += numberOrNull(option.ask) ?? 0;
    current.total_volume += numberOrNull(option.volume) ?? 0;
    groups.set(key, current);
  }

  return [...groups.values()].map((group) => ({
    symbol: group.symbol,
    timestamp: group.timestamp,
    expiration: group.expiration,
    type: group.type,
    contract_count: group.contract_count,
    avg_bid: group.contract_count > 0 ? group.bid_total / group.contract_count : null,
    avg_ask: group.contract_count > 0 ? group.ask_total / group.contract_count : null,
    total_volume: group.total_volume,
    source: group.source,
  }));
}

function normalizeSec(submissions, companyfacts, ticker) {
  const recent = submissions.filings?.recent;
  return {
    ticker,
    entity_name: submissions.name ?? companyfacts.entityName ?? "",
    cik: submissions.cik ?? companyfacts.cik ?? "",
    latest_filing_date: recent?.filingDate?.[0] ?? "",
    recent_filing_count: recent?.form?.length ?? 0,
    companyfacts_concepts: Object.values(companyfacts.facts ?? {}).reduce(
      (total, namespace) => total + Object.keys(namespace).length,
      0,
    ),
    source: "SEC EDGAR",
  };
}

function normalizeFutures(data) {
  return (data.tickers ?? []).map((ticker) => ({
    symbol: ticker.symbol,
    last: numberOrNull(ticker.last),
    mark_price: numberOrNull(ticker.markPrice),
    bid: numberOrNull(ticker.bid),
    ask: numberOrNull(ticker.ask),
    volume: numberOrNull(ticker.volume),
    open_interest: numberOrNull(ticker.openInterest),
    source: "Kraken Futures",
  }));
}

function tableQuality(table) {
  return {
    filename: table.filename,
    rows: table.rows,
    columns: table.columns,
    status: table.rows > 0 ? "ok" : "empty",
  };
}

async function main() {
  const { rawDir, runDate } = await latestRawDir();
  const processedDir = join(processedRoot, runDate);
  await mkdir(processedDir, { recursive: true });

  const manifest = await readJson(rawDir, "manifest.json");
  const tables = [];

  const cryptoDaily = [];
  const cryptoHourly = [];
  const cryptoOrderbook = [];
  const cryptoTrades = [];
  for (const pair of cryptoPairs) {
    cryptoDaily.push(
      ...normalizeOhlc(await readJson(rawDir, `kraken_${pair.slug}_ohlc_daily.json`), pair.symbol, "1d"),
    );
    cryptoHourly.push(
      ...normalizeOhlc(await readJson(rawDir, `kraken_${pair.slug}_ohlc_hourly.json`), pair.symbol, "1h"),
    );
    cryptoOrderbook.push(
      ...normalizeOrderbook(await readJson(rawDir, `kraken_${pair.slug}_orderbook_25.json`), pair.symbol),
    );
    cryptoTrades.push(
      ...normalizeTrades(await readJson(rawDir, `kraken_${pair.slug}_recent_trades.json`), pair.symbol),
    );
  }

  const etfPrices = (
    await Promise.all(
      etfSymbols.map((symbol) => readJson(rawDir, `yahoo_${symbol.toLowerCase()}_daily.json`).then((data) => normalizeEtf(data, symbol))),
    )
  ).flat();

  const treasury = parseTreasury(await readText(rawDir, "treasury_yield_curve.csv"));
  const sofr = normalizeSofr(await readJson(rawDir, "nyfed_sofr.json"));
  const macro = [
    ...normalizeBls(await readJson(rawDir, "bls_cpi_u.json"), "CPI-U"),
    ...normalizeBls(await readJson(rawDir, "bls_unemployment_rate.json"), "Unemployment Rate"),
  ];
  const options = (
    await Promise.all(
      optionSymbols.map((symbol) => readJson(rawDir, `cboe_${symbol.toLowerCase()}_options.json`).then((data) => normalizeOptions(data, symbol))),
    )
  ).flat();
  const sec = await Promise.all(
    secCompanies.map(async (ticker) =>
      normalizeSec(
        await readJson(rawDir, `sec_${ticker.toLowerCase()}_submissions.json`),
        await readJson(rawDir, `sec_${ticker.toLowerCase()}_companyfacts.json`),
        ticker,
      ),
    ),
  );
  const futures = normalizeFutures(await readJson(rawDir, "kraken_futures_tickers.json"));

  tables.push(await writeCsv(processedDir, "crypto_ohlc_daily.csv", headers.cryptoOhlc, cryptoDaily));
  tables.push(await writeCsv(processedDir, "crypto_ohlc_hourly.csv", headers.cryptoOhlc, cryptoHourly));
  tables.push(await writeCsv(processedDir, "crypto_orderbook_top25.csv", headers.orderbook, cryptoOrderbook));
  tables.push(await writeCsv(processedDir, "crypto_recent_trades.csv", headers.trades, cryptoTrades));
  tables.push(await writeCsv(processedDir, "etf_prices_daily.csv", headers.etfPrices, etfPrices));
  tables.push(await writeCsv(processedDir, "treasury_curve.csv", headers.treasury, treasury));
  tables.push(await writeCsv(processedDir, "sofr.csv", headers.sofr, sofr));
  tables.push(await writeCsv(processedDir, "macro_bls.csv", headers.macro, macro));
  tables.push(await writeCsv(processedDir, "options_chain_summary.csv", headers.options, options));
  tables.push(await writeCsv(processedDir, "sec_company_summary.csv", headers.sec, sec));
  tables.push(await writeCsv(processedDir, "kraken_futures_tickers.csv", headers.futures, futures));

  const rowTotal = tables.reduce((total, table) => total + table.rows, 0);
  const dataMoat = {
    generatedAt: new Date().toISOString(),
    rawRun: {
      runDate,
      fetchedAt: manifest.fetchedAt,
      sources: manifest.total,
      successfulSources: manifest.ok,
      errors: manifest.errors,
    },
    processedRun: {
      path: `data/processed/${runDate}/`,
      tables: tables.length,
      rows: rowTotal,
      quality: tables.map(tableQuality),
    },
    coverage: {
      cryptoAssets: cryptoPairs.map((pair) => pair.symbol),
      marketProxies: etfSymbols,
      optionUnderlyings: optionSymbols,
      secCompanies,
      macroSeries: ["Treasury curve", "SOFR", "CPI-U", "Unemployment Rate"],
    },
    moatPrinciples: [
      "Raw vendor-shaped payloads are preserved locally and ignored by git.",
      "Processed tables normalize timestamps, symbols, units, and source labels.",
      "Every refresh produces row counts and quality status for auditability.",
      "Private portfolio data stays in data/private/ and is never committed.",
    ],
    nextMoatLayers: [
      "Add point-in-time corporate actions and splits.",
      "Store processed tables in DuckDB or Postgres for query speed.",
      "Add licensed history for options, futures positioning, and news sentiment.",
      "Add reproducible feature tables for risk scores and trade scanners.",
    ],
  };

  await writeFile(join(processedDir, "quality_report.json"), `${JSON.stringify(dataMoat, null, 2)}\n`);
  await writeFile(moatSummaryPath, `${JSON.stringify(dataMoat, null, 2)}\n`);
  console.log(`Wrote ${tables.length} processed tables (${rowTotal} rows) to data/processed/${runDate}/`);
  console.log(`Wrote ${moatSummaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
