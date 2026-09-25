import { motion, useReducedMotion } from "motion/react";
import { formatCurrency } from "../lib/format.js";
import { EmptyState, Skeleton } from "./ui.jsx";

const BAR_COLORS = ["#818cf8", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];

// Shared allocation bars (Dashboard + Portfolio). Handles {symbol,value,percent}
// and {category,value,percent}. Widths are absolute percent of portfolio.
export default function AllocationBars({ data, isLoading }) {
  const reduce = useReducedMotion();
  if (isLoading) return <Skeleton className="h-40" />;
  if (!data?.length) return <EmptyState title="No allocation data yet." hint="Your holdings mix will appear here." />;
  return (
    <ul className="space-y-3.5 text-sm">
      {data.map((a, i) => {
        const label = a.symbol ?? a.category ?? "—";
        const pct = Math.max(0, Math.min(100, Number(a.percent) || 0));
        const color = a.category === "Cash" ? "#64748b" : BAR_COLORS[i % BAR_COLORS.length];
        return (
          <li key={label}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-2 font-medium text-slate-100">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {label}
              </span>
              <span className="tnum font-mono text-xs text-slate-400">
                {formatCurrency(a.value)} ({pct.toFixed(1)}%)
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label} allocation`}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 90, damping: 22, delay: i * 0.06 }
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
