import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { portfolioApi } from "../api/portfolio.js";
import { queryKeys } from "../lib/queryClient.js";
import { formatCurrency, formatPnl, formatPercentage } from "../lib/format.js";
import PriceChart from "../components/PriceChart.jsx";
import { Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

// Dev1 portfolio page per PLAN Sec 17: Summary → Performance → Allocation → Holdings.
export default function Portfolio() {
  const summary = useQuery({ queryKey: queryKeys.portfolioSummary(), queryFn: portfolioApi.summary });
  const positions = useQuery({ queryKey: queryKeys.positions(), queryFn: portfolioApi.positions });
  const performance = useQuery({ queryKey: queryKeys.portfolioPerformance("1m"), queryFn: () => portfolioApi.performance("1m") });
  const allocation = useQuery({ queryKey: queryKeys.portfolioAllocation(), queryFn: portfolioApi.allocation });

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-lg font-bold">Portfolio</h1>
        {summary.isLoading ? <Skeleton className="mt-2 h-10" /> : summary.isError ? (
          <ErrorState message="Summary failed to load." onRetry={() => summary.refetch()} />
        ) : summary.data ? (
          <p className="mt-1 text-sm text-slate-300">
            {formatCurrency(summary.data.totalValue)} · Cash {formatCurrency(summary.data.cash)} · {formatPnl(summary.data.totalReturn)} ({formatPercentage(summary.data.returnPercent)})
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">Performance</h2>
        {performance.isLoading ? <Skeleton className="h-48" /> : performance.data?.dailyReturns ? (
          <PriceChart data={performance.data.dailyReturns} />
        ) : <EmptyState title="No performance data yet." />}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">Allocation</h2>
        {allocation.isLoading ? <Skeleton className="h-24" /> : allocation.data?.length ? (
          <ul className="space-y-1 text-sm">
            {allocation.data.map((a) => (
              <li key={a.symbol ?? a.category} className="flex justify-between">
                <span>{a.symbol ?? a.category}</span>
                <span className="text-slate-400">{formatCurrency(a.value)} ({a.percent}%)</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No allocation data yet." />}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">Holdings</h2>
        {positions.isLoading ? <Skeleton className="h-24" /> : positions.isError ? (
          <ErrorState message="Positions failed to load." onRetry={() => positions.refetch()} />
        ) : positions.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="py-1">Symbol</th><th>Qty</th><th>Avg</th><th>Price</th><th>Value</th><th>P&L</th></tr>
              </thead>
              <tbody>
                {positions.data.map((p) => (
                  <tr key={p.symbol} className="border-t border-slate-800">
                    <td className="py-2"><Link to={`/stocks/${p.symbol}`} className="font-medium hover:underline">{p.symbol}</Link></td>
                    <td>{p.quantity}</td>
                    <td>{formatCurrency(p.averageCost)}</td>
                    <td>{formatCurrency(p.currentPrice)}</td>
                    <td>{formatCurrency(p.marketValue)}</td>
                    <td>{formatPnl(p.unrealizedPnl)} ({formatPercentage(p.unrealizedPnlPercent)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No positions yet." />}
      </Card>
    </div>
  );
}
