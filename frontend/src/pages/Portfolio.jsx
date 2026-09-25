import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { portfolioApi } from "../api/portfolio.js";
import { queryKeys } from "../lib/queryClient.js";
import { formatCurrency, formatPnl, formatPercentage } from "../lib/format.js";
import PriceChart from "../components/PriceChart.jsx";
import AllocationBars from "../components/AllocationBars.jsx";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

// Dev1 portfolio page per PLAN Sec 17: Summary → Performance → Allocation → Holdings.
export default function Portfolio() {
  const summary = useQuery({ queryKey: queryKeys.portfolioSummary(), queryFn: portfolioApi.summary });
  const positions = useQuery({ queryKey: queryKeys.positions(), queryFn: portfolioApi.positions });
  const performance = useQuery({ queryKey: queryKeys.portfolioPerformance("1m"), queryFn: () => portfolioApi.performance("1m") });
  const allocation = useQuery({ queryKey: queryKeys.portfolioAllocation(), queryFn: portfolioApi.allocation });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-bold text-white">Portfolio</h1>
          {summary.data ? <Badge tone="neutral">Paper</Badge> : null}
        </div>
        {summary.isLoading ? <Skeleton className="mt-2 h-10" /> : summary.isError ? (
          <ErrorState message="Summary failed to load." onRetry={() => summary.refetch()} />
        ) : summary.data ? (
          <p className="mt-2 text-sm tabular-nums text-slate-300">
            <span className="text-base font-semibold text-white">{formatCurrency(summary.data.totalValue)}</span>
            {" "}· Cash {formatCurrency(summary.data.cash)} ·{" "}
            <span className={Number(summary.data.totalReturn) >= 0 ? "text-emerald-300" : "text-rose-300"}>
              {formatPnl(summary.data.totalReturn)} ({formatPercentage(summary.data.returnPercent)})
            </span>
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Performance</h2>
          <Badge tone="neutral">1M</Badge>
        </div>
        {performance.isLoading ? <Skeleton className="h-48" /> : performance.isError ? (
          <ErrorState message="Performance failed to load." onRetry={() => performance.refetch()} />
        ) : performance.data?.dailyReturns?.length ? (
          <PriceChart data={performance.data.dailyReturns} heightClass="h-56" />
        ) : <EmptyState title="No performance data yet." hint="Data appears after your first trade settles." />}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">Allocation</h2>
        {allocation.isError ? (
          <ErrorState message="Allocation failed to load." onRetry={() => allocation.refetch()} />
        ) : (
          <AllocationBars data={allocation.data} isLoading={allocation.isLoading} />
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-white">Holdings</h2>
        {positions.isLoading ? <Skeleton className="h-24" /> : positions.isError ? (
          <ErrorState message="Positions failed to load." onRetry={() => positions.refetch()} />
        ) : positions.data?.length ? (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-150 text-left text-sm tabular-nums">
              <thead className="sticky top-0 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="py-2 pr-3">Symbol</th><th className="pr-3 text-right">Qty</th><th className="pr-3 text-right">Avg</th><th className="pr-3 text-right">Price</th><th className="pr-3 text-right">Value</th><th className="text-right">P&L</th></tr>
              </thead>
              <tbody>
                {positions.data.map((p) => (
                  <tr key={p.symbol} className="border-t border-slate-800 hover:bg-slate-800/40">
                    <td className="py-2 pr-3"><Link to={`/stocks/${p.symbol}`} className="rounded font-medium hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">{p.symbol}</Link></td>
                    <td className="pr-3 text-right">{p.quantity}</td>
                    <td className="pr-3 text-right">{formatCurrency(p.averageCost)}</td>
                    <td className="pr-3 text-right">{formatCurrency(p.currentPrice)}</td>
                    <td className="pr-3 text-right">{formatCurrency(p.marketValue)}</td>
                    <td className={`text-right ${Number(p.unrealizedPnl) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatPnl(p.unrealizedPnl)} ({formatPercentage(p.unrealizedPnlPercent)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No positions yet." hint="Place your first paper trade from a stock page." />}
      </Card>
    </div>
  );
}
