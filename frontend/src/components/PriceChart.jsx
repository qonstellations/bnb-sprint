import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "../lib/format.js";

// Minimal interactive price chart per PLAN Sec 12. No indicators.
function ChartTooltip({ active, payload, label, currency = "USD" }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold text-white">{formatCurrency(v, currency)}</p>
    </div>
  );
}

export default function PriceChart({ data, currency = "USD", heightClass = "h-64" }) {
  if (!data?.length) return null;
  // Two endpoints share this chart with different shapes: market history uses
  // timestamp/close, portfolio performance uses date/value. Normalize once here.
  const rows = data.map((d) => ({
    t: new Date(d.timestamp ?? d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: d.close ?? d.value ?? d.portfolioValue,
  }));
  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#334155" }} minTickGap={32} />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            width={72}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
          />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="price"
            name="Price"
            stroke="#818cf8"
            strokeWidth={2}
            fill="#312e81"
            fillOpacity={0.55}
            dot={false}
            activeDot={{ r: 4, fill: "#818cf8", stroke: "#fff", strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
