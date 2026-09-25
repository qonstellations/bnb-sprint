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
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

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
        {instrument.isLoading ? <Skeleton className="h-16" /> : instrument.isError ? (
          <ErrorState message="Instrument failed to load." onRetry={() => instrument.refetch()} />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-white">{instrument.data?.name} <span className="font-medium text-slate-500">({instrument.data?.symbol})</span></h1>
              <p className="mt-0.5 text-xs text-slate-500">{instrument.data?.exchange} · {instrument.data?.sector} · {instrument.data?.currency ?? "USD"}</p>
              {quote.isLoading ? (
                <Skeleton className="mt-2 h-8 w-44" />
              ) : quote.isError ? (
                <p className="mt-2 text-xs text-rose-300">Quote unavailable — retrying automatically. <button type="button" className="underline" onClick={() => quote.refetch()}>Retry</button></p>
              ) : quote.data ? (
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {formatCurrency(quote.data.currentPrice, instrument.data?.currency)}
                  <span className={`ml-2 rounded-full px-2 py-0.5 align-middle text-sm ${Number(quote.data.change) >= 0 ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300"}`}>
                    {formatPercentage(quote.data.changePercent)}
                  </span>
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              type="button"
              disabled={toggleWatch.isPending}
              onClick={() => toggleWatch.mutate()}
              aria-pressed={watched}
              aria-label="Toggle watchlist"
              className={watched ? "border-amber-600 text-amber-300" : undefined}
            >
              ★ {watched ? "Watching" : "Watch"}
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Price</h2>
            <Badge tone="neutral">1D · 1M</Badge>
          </div>
          {history.isLoading ? <Skeleton className="h-64" /> : history.isError ? (
            <ErrorState message="Price history failed to load." onRetry={() => history.refetch()} />
          ) : history.data?.length ? <PriceChart data={history.data} currency={instrument.data?.currency} /> : <EmptyState title="No price history." hint="Try again in a moment." />}
          <a href="#trade" className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500 md:hidden">
            Jump to trade
          </a>
        </Card>
        <Card id="trade" className="scroll-mt-24 md:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-white">Trade <Badge tone="info" className="ml-1">Paper</Badge></h2>
          {quote.data ? (
            <OrderForm symbol={symbol} currentPrice={quote.data.currentPrice} currency={instrument.data?.currency} />
          ) : quote.isLoading ? <Skeleton className="h-48" /> : <EmptyState title="Quote unavailable." hint="Trading resumes when the quote loads." />}
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
