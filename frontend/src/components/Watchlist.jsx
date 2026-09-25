import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market.js";
import { watchlistApi } from "../api/watchlist.js";
import { queryKeys } from "../lib/queryClient.js";
import { toast } from "../lib/toast.js";
import { normalizeApiError } from "../lib/errors.js";
import { formatCurrency, formatPercentage } from "../lib/format.js";
import { EmptyState, ErrorState, Skeleton } from "./ui.jsx";

// Dev1 watchlist per PLAN Sec 18. Uses bulk GET /market/quotes; no per-item quote spam.
export default function Watchlist({ compact = false }) {
  const queryClient = useQueryClient();
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
    return <EmptyState title="Your watchlist is empty." hint="Add stocks from any stock page." />;

  const bySymbol = Object.fromEntries((quotesQuery.data ?? []).map((q) => [q.symbol, q]));

  return (
    <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
      {symbols.slice(0, compact ? 5 : undefined).map((symbol) => {
        const q = bySymbol[symbol];
        return (
          <li key={symbol} className="flex items-center gap-3 px-3 py-2">
            <Link to={`/stocks/${symbol}`} className="text-sm font-medium hover:underline">
              {symbol}
            </Link>
            <span className="text-xs text-slate-400">
              {q ? formatCurrency(q.currentPrice) : "…"}
            </span>
            {q ? (
              <span className={`text-xs ${q.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {formatPercentage(q.changePercent)}
              </span>
            ) : null}
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(symbol)}
              className="ml-auto text-xs text-slate-500 hover:text-rose-300"
              aria-label={`Remove ${symbol}`}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}
