import { formatCurrency } from "../lib/format.js";
import { EmptyState, Skeleton } from "./ui.jsx";

// Shared allocation bars (Dashboard + Portfolio). Handles {symbol,value,percent} and {category,value,percent}.
export default function AllocationBars({ data, isLoading }) {
  if (isLoading) return <Skeleton className="h-40" />;
  if (!data?.length) return <EmptyState title="No allocation data yet." hint="Your holdings mix will appear here." />;
  const max = Math.max(...data.map((a) => Number(a.percent) || 0), 1);
  return (
    <ul className="space-y-3 text-sm">
      {data.map((a) => {
        const label = a.symbol ?? a.category ?? "—";
        const pct = Number(a.percent) || 0;
        return (
          <li key={label}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-slate-100">{label}</span>
              <span className="text-xs tabular-nums text-slate-400">
                {formatCurrency(a.value)} ({pct.toFixed(1)}%)
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} allocation`}>
              <div
                className={`h-full rounded-full ${a.category === "Cash" ? "bg-slate-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(100, (pct / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
