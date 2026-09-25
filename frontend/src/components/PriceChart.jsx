import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "motion/react";
import { formatCurrency } from "../lib/format.js";

// Shared price/performance chart. Market history uses timestamp/close,
// portfolio performance uses date/value — normalized once here.
function ChartTooltip({ active, payload, label, currency = "INR" }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-850/95 px-3 py-2 text-xs shadow-card backdrop-blur">
      <p className="text-slate-400">{label}</p>
      <p className="tnum font-mono text-sm font-semibold text-white">{formatCurrency(v, currency)}</p>
    </div>
  );
}

export default function PriceChart({ data, currency = "INR", heightClass = "h-64" }) {
  const gradientId = useId();
  const reduce = useReducedMotion();
  if (!data?.length) return null;
  const rows = data.map((d) => ({
    t: new Date(d.timestamp ?? d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: d.close ?? d.value ?? d.portfolioValue,
  }));
  const first = rows[0]?.price ?? 0;
  const last = rows[rows.length - 1]?.price ?? 0;
  const up = last >= first;
  const stroke = up ? "#34d399" : "#fb7185";
  const stop = up ? "#34d399" : "#fb7185";
  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stop} stopOpacity={0.32} />
              <stop offset="100%" stopColor={stop} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(255 255 255 / 0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fontSize: 11, fill: "#7d8aa0" }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#7d8aa0" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            width={56}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
          />
          <Tooltip
            content={<ChartTooltip currency={currency} />}
            cursor={{ stroke: "rgb(255 255 255 / 0.15)" }}
          />
          <Area
            type="monotone"
            dataKey="price"
            name="Price"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: stroke, stroke: "#0a0e14", strokeWidth: 2 }}
            isAnimationActive={!reduce}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
