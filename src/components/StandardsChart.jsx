import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATA = [
  { name: "Foundation", coverage: 100 },
  { name: "Governance", coverage: 85 },
  { name: "Operations", coverage: 92 },
];

export function StandardsChart() {
  return (
    <div className="h-36 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#8e939c", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "#111113",
              border: "1px solid rgba(235,230,220,0.1)",
              borderRadius: 2,
              fontSize: 11,
            }}
            labelStyle={{ color: "#ebe6dc" }}
            cursor={{ fill: "rgba(74,127,168,0.08)" }}
          />
          <Bar dataKey="coverage" fill="#4a7fa8" radius={[2, 2, 0, 0]} opacity={0.75} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 font-mono-label text-[var(--color-steel)]">
        Standards coverage · illustrative placeholder
      </p>
    </div>
  );
}
