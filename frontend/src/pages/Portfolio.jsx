import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { portfolioApi } from "../api/portfolio.js";
import { queryKeys } from "../lib/queryClient.js";
import { formatCurrency, formatPnl, formatPercentage } from "../lib/format.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
import PriceChart from "../components/PriceChart.jsx";
import AllocationBars from "../components/AllocationBars.jsx";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

// Dev1 portfolio page per PLAN Sec 17: Summary → Performance → Allocation → Holdings.
export default function Portfolio() {
  const reduce = useReducedMotion();
  const summary = useQuery({ queryKey: queryKeys.portfolioSummary(), queryFn: portfolioApi.summary });
  const positions = useQuery({ queryKey: queryKeys.positions(), queryFn: portfolioApi.positions });
  const performance = useQuery({ queryKey: queryKeys.portfolioPerformance("1m"), queryFn: () => portfolioApi.performance("1m") });
  const allocation = useQuery({ queryKey: queryKeys.portfolioAllocation(), queryFn: portfolioApi.allocation });

  const pnlPositive = Number(summary.data?.totalReturn ?? 0) >= 0;

  return (
    <motion.div className="space-y-6" variants={staggerParent()} initial={reduce ? false : "hidden"} animate="show">
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-display text-xl font-bold text-white">Portfolio</h1>
            {summary.data ? <Badge tone="neutral">Paper</Badge> : null}
          </div>
          {summary.isLoading ? <Skeleton className="mt-3 h-10" /> : summary.isError ? (
            <div className="mt-3">
              <ErrorState message="Summary failed to load." onRetry={() => summary.refetch()} />
            </div>
          ) : summary.data ? (
            <>
              <p className="mt-3 font-display text-3xl font-bold tabular-nums tnum text-white">{formatCurrency(summary.data.totalValue)}</p>
              <p className="mt-1.5 font-mono text-sm tabular-nums tnum text-slate-400">
                Cash {formatCurrency(summary.data.cash)}{" "}
                <span className="text-slate-500">·</span>{" "}
                <span className={pnlPositive ? "text-emerald-300" : "text-rose-300"}>
                  {formatPnl(summary.data.totalReturn)} ({formatPercentage(summary.data.returnPercent)})
                </span>
              </p>
            </>
          ) : null}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Performance</h2>
            <Badge tone="neutral">1M</Badge>
          </div>
          {performance.isLoading ? <Skeleton className="h-48" /> : performance.isError ? (
            <ErrorState message="Performance failed to load." onRetry={() => performance.refetch()} />
          ) : performance.data?.dailyReturns?.length ? (
            <PriceChart data={performance.data.dailyReturns} heightClass="h-56" />
          ) : <EmptyState title="No performance data yet." hint="Data appears after your first trade settles." />}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Allocation</h2>
          </div>
          {allocation.isError ? (
            <ErrorState message="Allocation failed to load." onRetry={() => allocation.refetch()} />
          ) : (
            <AllocationBars data={allocation.data} isLoading={allocation.isLoading} />
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="mb-2 font-display text-sm font-semibold text-white">Holdings</h2>
          {positions.isLoading ? <Skeleton className="h-24" /> : positions.isError ? (
            <ErrorState message="Positions failed to load." onRetry={() => positions.refetch()} />
          ) : positions.data?.length ? (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-150 text-left text-sm">
                <thead className="sticky top-0 bg-ink-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr><th className="py-2 pr-3">Symbol</th><th className="pr-3 text-right">Qty</th><th className="pr-3 text-right">Avg</th><th className="pr-3 text-right">Price</th><th className="pr-3 text-right">Value</th><th className="text-right">P&amp;L</th></tr>
                </thead>
                <tbody>
                  {positions.data.map((p) => {
                    const positive = Number(p.unrealizedPnl) >= 0;
                    return (
                      <tr key={p.symbol} className="border-t border-white/5 transition-colors hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-3"><Link to={`/stocks/${p.symbol}`} className="rounded font-mono font-semibold text-white underline-offset-4 hover:text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">{p.symbol}</Link></td>
                        <td className="pr-3 text-right font-mono tabular-nums tnum text-slate-400">{p.quantity}</td>
                        <td className="pr-3 text-right font-mono tabular-nums tnum text-slate-400">{formatCurrency(p.averageCost)}</td>
                        <td className="pr-3 text-right font-mono tabular-nums tnum text-slate-400">{formatCurrency(p.currentPrice)}</td>
                        <td className="pr-3 text-right font-mono tabular-nums tnum text-slate-200">{formatCurrency(p.marketValue)}</td>
                        <td className={`text-right font-mono tabular-nums tnum ${positive ? "text-emerald-300" : "text-rose-300"}`}>{formatPnl(p.unrealizedPnl)} ({formatPercentage(p.unrealizedPnlPercent)})</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No positions yet." hint="Place your first paper trade from a stock page." />}
        </Card>
      </motion.div>
    </motion.div>
  );
}
