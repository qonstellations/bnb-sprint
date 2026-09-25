import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { portfolioApi } from "../api/portfolio.js";
import { queryKeys } from "../lib/queryClient.js";
import { formatCurrency, formatPnl, formatPercentage } from "../lib/format.js";
import StockSearch from "../components/StockSearch.jsx";
import Watchlist from "../components/Watchlist.jsx";
import PriceChart from "../components/PriceChart.jsx";
import { Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

// Dev1 dashboard per PLAN Sec 8: summary, holdings preview, performance, allocation, watchlist.
export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusSearch = searchParams.get("focus") === "search";
  const searchRef = useRef(null);
  const summary = useQuery({ queryKey: queryKeys.portfolioSummary(), queryFn: portfolioApi.summary });
  const positions = useQuery({ queryKey: queryKeys.positions(), queryFn: portfolioApi.positions });
  const performance = useQuery({
    queryKey: queryKeys.portfolioPerformance("1m"),
    queryFn: () => portfolioApi.performance("1m"),
  });
  const allocation = useQuery({ queryKey: queryKeys.portfolioAllocation(), queryFn: portfolioApi.allocation });

  useEffect(() => {
    if (focusSearch && searchRef.current) {
      searchRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Clear the param so back/forward stays clean; focus is handled via autoFocus.
      setSearchParams({}, { replace: true });
    }
  }, [focusSearch, setSearchParams]);

  return (
    <div className="space-y-6">
      <div ref={searchRef} id="search" className="scroll-mt-20">
        <StockSearch autoFocus={focusSearch} />
      </div>

      {summary.isLoading ? (
        <Skeleton className="h-24" />
      ) : summary.isError ? (
        <ErrorState message="Portfolio summary failed to load." onRetry={() => summary.refetch()} />
      ) : summary.data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><p className="text-xs text-slate-500">Total value</p><p className="text-lg font-semibold">{formatCurrency(summary.data.totalValue)}</p></Card>
          <Card><p className="text-xs text-slate-500">Cash</p><p className="text-lg font-semibold">{formatCurrency(summary.data.cash)}</p></Card>
          <Card><p className="text-xs text-slate-500">Total P&L</p><p className="text-lg font-semibold">{formatPnl(summary.data.totalReturn)} ({formatPercentage(summary.data.returnPercent)})</p></Card>
          <Card><p className="text-xs text-slate-500">Positions</p><p className="text-lg font-semibold">{positions.data?.length ?? 0}</p></Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Performance</h2>
          {performance.isLoading ? <Skeleton className="h-40" /> : performance.data?.dailyReturns ? (
            <PriceChart data={performance.data.dailyReturns} />
          ) : <EmptyState title="No performance data yet." />}
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Allocation</h2>
          {allocation.isLoading ? <Skeleton className="h-40" /> : allocation.data?.length ? (
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
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Holdings</h2>
          <Link to="/portfolio" className="text-xs text-indigo-300 underline">View all</Link>
        </div>
        {positions.isLoading ? <Skeleton className="h-24" /> : positions.isError ? (
          <ErrorState message="Holdings failed to load." onRetry={() => positions.refetch()} />
        ) : positions.data?.length ? (
          <ul className="divide-y divide-slate-800 text-sm">
            {positions.data.slice(0, 5).map((p) => (
              <li key={p.symbol} className="flex justify-between py-2">
                <Link to={`/stocks/${p.symbol}`} className="font-medium hover:underline">{p.symbol}</Link>
                <span className="text-slate-400">{p.quantity} × {formatCurrency(p.currentPrice)} · {formatPnl(p.unrealizedPnl)} ({formatPercentage(p.unrealizedPnlPercent)})</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No positions yet." hint="Place your first paper trade from a stock page." />}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">Watchlist</h2>
        <Watchlist compact />
      </Card>
    </div>
  );
}
