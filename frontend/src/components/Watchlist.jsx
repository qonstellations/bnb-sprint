import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Bookmark, Trash2 } from "lucide-react";
import { marketApi } from "../api/market.js";
import { watchlistApi } from "../api/watchlist.js";
import { queryKeys } from "../lib/queryClient.js";
import { toast } from "../lib/toast.js";
import { normalizeApiError } from "../lib/errors.js";
import { formatCurrency, formatPercentage } from "../lib/format.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
import { Badge, Button, EmptyState, ErrorState, Skeleton } from "./ui.jsx";

// Dev1 watchlist per PLAN Sec 18. Uses bulk GET /market/quotes; no per-item quote spam.
export default function Watchlist({ compact = false }) {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const listQuery = useQuery({ queryKey: queryKeys.watchlist(), queryFn: watchlistApi.list });
  const symbols = (listQuery.data ?? []).map((w) => w.symbol);

  const quotesQuery = useQuery({
    queryKey: queryKeys.quotes(symbols.join(",")),
    queryFn: () => marketApi.quotes(symbols),
    enabled: symbols.length > 0,
  });

  const remove = useMutation({
    mutationFn: (symbol) => watchlistApi.remove(symbol),
    onSuccess: (_data, symbol) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist() });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes() });
      toast.info(`${symbol} removed from watchlist.`);
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  if (listQuery.isLoading) return <Skeleton className="h-24" />;
  if (listQuery.isError)
    return <ErrorState message="Watchlist failed to load." onRetry={() => listQuery.refetch()} />;
  if (symbols.length === 0)
    return (
      <EmptyState
        icon={Bookmark}
        title="Your watchlist is empty."
        hint="Add stocks from any stock page to track them here."
      />
    );

  const bySymbol = Object.fromEntries((quotesQuery.data ?? []).map((q) => [q.symbol, q]));

  return (
    <div className="overflow-x-auto">
      <motion.ul
        variants={reduce ? undefined : staggerParent(0.04)}
        initial="hidden"
        animate="show"
        className="min-w-0"
      >
        {symbols.slice(0, compact ? 5 : undefined).map((symbol) => {
          const q = bySymbol[symbol];
          const up = (q?.change ?? 0) >= 0;
          return (
            <motion.li
              key={symbol}
              variants={reduce ? undefined : fadeUp}
              className="flex items-center gap-3 border-t border-white/5 px-1 py-2.5 transition-colors first:border-t-0 hover:bg-white/[0.02]"
            >
              <Link
                to={`/stocks/${symbol}`}
                className="shrink-0 font-mono text-sm font-semibold text-white hover:underline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {symbol}
              </Link>
              <span className="font-mono text-sm tabular-nums text-slate-300">
                {q ? formatCurrency(q.currentPrice) : "…"}
              </span>
              {q ? (
                <Badge tone={up ? "positive" : "negative"} className="font-mono tabular-nums">
                  {formatPercentage(q.changePercent)}
                </Badge>
              ) : null}
              <Button
                variant="ghost"
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(symbol)}
                aria-label={`Remove ${symbol}`}
                className="ml-auto h-8 min-h-0 w-8 px-0"
              >
                <Trash2 size={14} aria-hidden />
              </Button>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
