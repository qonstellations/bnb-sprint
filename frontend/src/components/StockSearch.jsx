import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, Search } from "lucide-react";
import { instrumentsApi } from "../api/instruments.js";
import { queryKeys } from "../lib/queryClient.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
import { EmptyState, ErrorState, Input, Skeleton } from "./ui.jsx";

// Single reusable search per PLAN Sec 9. Debounced, navigates to /stocks/:symbol.
export default function StockSearch({ autoFocus = false, placeholder = "Search ticker or company…" }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.instrumentSearch(debounced),
    queryFn: () => instrumentsApi.search(debounced),
    enabled: debounced.length > 0,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <Input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Search stocks"
          className="pl-10"
        />
      </div>
      {debounced.length === 0 ? null : isLoading ? (
        <div className="mt-2 space-y-1.5" aria-busy="true" aria-label="Searching stocks">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : isError ? (
        <div className="mt-2">
          <ErrorState message="Search failed. Please retry." onRetry={() => refetch()} />
        </div>
      ) : data?.length === 0 ? (
        <div className="mt-2">
          <EmptyState title={`No results for “${debounced}”.`} hint="Try a ticker like AAPL or a company name." />
        </div>
      ) : (
        <motion.ul
          variants={reduce ? undefined : staggerParent(0.04)}
          initial="hidden"
          animate="show"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-850 shadow-card"
        >
          {(data ?? []).map((item) => (
            <motion.li key={item.symbol} variants={reduce ? undefined : fadeUp} className="border-t border-white/5 first:border-t-0">
              <button
                type="button"
                onClick={() => navigate(`/stocks/${item.symbol}`)}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <span className="shrink-0 font-mono text-sm font-semibold text-white">{item.symbol}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                  {item.name}
                  {item.exchange ? <span className="text-slate-500"> · {item.exchange}</span> : null}
                </span>
                <ChevronRight
                  size={15}
                  aria-hidden
                  className="shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-slate-300"
                />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
