import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { portfolioApi } from "../api/portfolio.js";
import { queryKeys } from "../lib/queryClient.js";
import { formatCurrency, formatPnl, formatPercentage } from "../lib/format.js";
import StockSearch from "../components/StockSearch.jsx";
import Watchlist from "../components/Watchlist.jsx";
import PriceChart from "../components/PriceChart.jsx";
import AllocationBars from "../components/AllocationBars.jsx";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

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
          <Card><p className="text-xs uppercase tracking-wide text-slate-500">Total value</p><p className="mt-1 text-lg font-semibold tabular-nums text-white">{formatCurrency(summary.data.totalValue)}</p></Card>
          <Card><p className="text-xs uppercase tracking-wide text-slate-500">Cash</p><p className="mt-1 text-lg font-semibold tabular-nums text-white">{formatCurrency(summary.data.cash)}</p></Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total P&L</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${Number(summary.data.totalReturn) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {formatPnl(summary.data.totalReturn)} <span className="text-sm font-normal">({formatPercentage(summary.data.returnPercent)})</span>
            </p>
          </Card>
          <Card><p className="text-xs uppercase tracking-wide text-slate-500">Positions</p><p className="mt-1 text-lg font-semibold tabular-nums text-white">{positions.data?.length ?? 0}</p></Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Performance</h2>
            <Badge tone="neutral">1M</Badge>
          </div>
          {performance.isLoading ? <Skeleton className="h-40" /> : performance.isError ? (
            <ErrorState message="Performance failed to load." onRetry={() => performance.refetch()} />
          ) : performance.data?.dailyReturns?.length ? (
            <PriceChart data={performance.data.dailyReturns} heightClass="h-48" />
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
              <li key={p.symbol} className="flex items-baseline justify-between gap-2 py-2">
                <Link to={`/stocks/${p.symbol}`} className="rounded font-medium hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">{p.symbol}</Link>
                <span className="text-right tabular-nums text-slate-400">
                  {p.quantity} × {formatCurrency(p.currentPrice)} ·{" "}
                  <span className={Number(p.unrealizedPnl) >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {formatPnl(p.unrealizedPnl)} ({formatPercentage(p.unrealizedPnlPercent)})
                  </span>
                </span>
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
