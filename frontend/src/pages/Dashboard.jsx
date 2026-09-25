import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Banknote, Briefcase, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { portfolioApi } from "../api/portfolio.js";
import { queryKeys } from "../lib/queryClient.js";
import { formatCurrency, formatPnl, formatPercentage } from "../lib/format.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
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
  const reduce = useReducedMotion();
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
      // replace:true keeps ?focus=search out of history so Back never re-triggers the scroll.
      setSearchParams({}, { replace: true });
    }
  }, [focusSearch, setSearchParams]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const pnlPositive = Number(summary.data?.totalReturn ?? 0) >= 0;

  return (
    <motion.div className="space-y-6" variants={staggerParent()} initial={reduce ? false : "hidden"} animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-xl font-bold text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">{today}</p>
      </motion.div>

      <motion.div ref={searchRef} id="search" variants={fadeUp} className="scroll-mt-20">
        <StockSearch autoFocus={focusSearch} />
      </motion.div>

      {summary.isLoading ? (
        <motion.div variants={fadeUp}>
          <Skeleton className="h-24" />
        </motion.div>
      ) : summary.isError ? (
        <motion.div variants={fadeUp}>
          <ErrorState message="Portfolio summary failed to load." onRetry={() => summary.refetch()} />
        </motion.div>
      ) : summary.data ? (
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/25">
              <Wallet size={16} aria-hidden />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total value</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums tnum text-white">{formatCurrency(summary.data.totalValue)}</p>
          </Card>
          <Card>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/25">
              <Banknote size={16} aria-hidden />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cash</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums tnum text-white">{formatCurrency(summary.data.cash)}</p>
          </Card>
          <Card>
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${pnlPositive ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25" : "bg-rose-500/10 text-rose-300 ring-rose-500/25"}`}>
              {pnlPositive ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total P&amp;L</p>
            <p className={`mt-1 font-display text-xl font-bold tabular-nums tnum ${pnlPositive ? "text-emerald-300" : "text-rose-300"}`}>
              {formatPnl(summary.data.totalReturn)}{" "}
              <span className="font-mono text-sm font-medium tabular-nums tnum text-slate-400">({formatPercentage(summary.data.returnPercent)})</span>
            </p>
          </Card>
          <Card>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/25">
              <Briefcase size={16} aria-hidden />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Positions</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums tnum text-white">{positions.data?.length ?? 0}</p>
          </Card>
        </motion.div>
      ) : null}

      <motion.div variants={fadeUp} className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Performance</h2>
            <Badge tone="neutral">1M</Badge>
          </div>
          {performance.isLoading ? <Skeleton className="h-40" /> : performance.isError ? (
            <ErrorState message="Performance failed to load." onRetry={() => performance.refetch()} />
          ) : performance.data?.dailyReturns?.length ? (
            <PriceChart data={performance.data.dailyReturns} heightClass="h-48" />
          ) : <EmptyState title="No performance data yet." hint="Data appears after your first trade settles." />}
        </Card>
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
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Holdings</h2>
            <Link to="/portfolio" className="rounded text-xs font-medium text-indigo-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">View all</Link>
          </div>
          {positions.isLoading ? <Skeleton className="h-24" /> : positions.isError ? (
            <ErrorState message="Holdings failed to load." onRetry={() => positions.refetch()} />
          ) : positions.data?.length ? (
            <ul className="divide-y divide-white/5 text-sm">
              {positions.data.slice(0, 5).map((p) => {
                const positive = Number(p.unrealizedPnl) >= 0;
                return (
                  <li key={p.symbol} className="flex items-center justify-between gap-3 py-2.5">
                    <Link to={`/stocks/${p.symbol}`} className="rounded font-mono font-semibold text-white hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-indigo-500">{p.symbol}</Link>
                    <span className="flex flex-wrap items-center justify-end gap-2 text-right">
                      <span className="font-mono text-xs tabular-nums tnum text-slate-500">
                        {p.quantity} × {formatCurrency(p.currentPrice)}
                      </span>
                      <Badge tone={positive ? "positive" : "negative"} className="font-mono tabular-nums tnum">
                        {formatPnl(p.unrealizedPnl)} ({formatPercentage(p.unrealizedPnlPercent)})
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState title="No positions yet." hint="Place your first paper trade from a stock page." />}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="mb-2 font-display text-sm font-semibold text-white">Watchlist</h2>
          <Watchlist compact />
        </Card>
      </motion.div>
    </motion.div>
  );
}
