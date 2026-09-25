import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { instrumentsApi } from "../api/instruments.js";
import { marketApi } from "../api/market.js";
import { watchlistApi } from "../api/watchlist.js";
import { queryKeys } from "../lib/queryClient.js";
import { toast } from "../lib/toast.js";
import { normalizeApiError } from "../lib/errors.js";
import { formatCurrency, formatPercentage } from "../lib/format.js";
import PriceChart from "../components/PriceChart.jsx";
import OrderForm from "../components/OrderForm.jsx";
import SentimentScorecard from "../components/dev2/SentimentScorecard.jsx";
import SentimentTimeline from "../components/dev2/SentimentTimeline.jsx";
import NewsList from "../components/dev2/NewsList.jsx";
import AlertForm from "../components/dev2/AlertForm.jsx";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

// Shared stock route per PLAN Sec 38: /stocks/:symbol with exact backend symbol format.
// Dev1 owns header/quote/chart/watchlist/trade; Dev2 slots mount below without layout takeover.
export default function StockDetail() {
  const { symbol = "" } = useParams();
  const queryClient = useQueryClient();

  const instrument = useQuery({ queryKey: queryKeys.instrument(symbol), queryFn: () => instrumentsApi.get(symbol), enabled: !!symbol });
  const quote = useQuery({ queryKey: queryKeys.quote(symbol), queryFn: () => marketApi.quote(symbol), enabled: !!symbol, refetchInterval: 30_000 });
  const history = useQuery({ queryKey: queryKeys.history(symbol, { range: "1m" }), queryFn: () => marketApi.history(symbol, { range: "1m", interval: "1d" }), enabled: !!symbol });
  const watchlist = useQuery({ queryKey: queryKeys.watchlist(), queryFn: watchlistApi.list });
  const watched = (watchlist.data ?? []).some((w) => w.symbol === symbol);

  const toggleWatch = useMutation({
    mutationFn: () => (watched ? watchlistApi.remove(symbol) : watchlistApi.add(symbol)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist() });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes() });
      toast.info(watched ? `${symbol} removed from watchlist.` : `${symbol} added to watchlist.`);
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        {instrument.isLoading ? <Skeleton className="h-12" /> : instrument.isError ? (
          <ErrorState message="Instrument failed to load." onRetry={() => instrument.refetch()} />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{instrument.data?.name} <span className="text-slate-500">({instrument.data?.symbol})</span></h1>
              <p className="text-xs text-slate-500">{instrument.data?.exchange} · {instrument.data?.sector} · {instrument.data?.currency ?? "USD"}</p>
              {quote.data ? (
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(quote.data.currentPrice, instrument.data?.currency)}
                  <span className={`ml-2 text-sm ${quote.data.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {formatPercentage(quote.data.changePercent)}
                  </span>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={toggleWatch.isPending}
              onClick={() => toggleWatch.mutate()}
              className={`rounded-lg border px-3 py-1.5 text-sm ${watched ? "border-amber-600 text-amber-300" : "border-slate-700 text-slate-300"}`}
              aria-label="Toggle watchlist"
            >
              ★ {watched ? "Watching" : "Watch"}
            </button>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <h2 className="mb-2 text-sm font-semibold">Price</h2>
          {history.isLoading ? <Skeleton className="h-64" /> : history.isError ? (
            <ErrorState message="Price history failed to load." onRetry={() => history.refetch()} />
          ) : history.data?.length ? <PriceChart data={history.data} /> : <EmptyState title="No price history." />}
        </Card>
        <Card className="md:col-span-2">
          <h2 className="mb-2 text-sm font-semibold">Trade <Badge tone="info" className="ml-1">Paper</Badge></h2>
          {quote.data ? (
            <OrderForm symbol={symbol} currentPrice={quote.data.currentPrice} currency={instrument.data?.currency} />
          ) : <Skeleton className="h-32" />}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card><SentimentScorecard symbol={symbol} /></Card>
        <Card><AlertForm symbol={symbol} /></Card>
      </div>
      <Card><SentimentTimeline symbol={symbol} /></Card>
      <Card><NewsList symbol={symbol} /></Card>
    </div>
  );
}
