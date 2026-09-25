import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Star } from "lucide-react";
import { instrumentsApi } from "../api/instruments.js";
import { marketApi } from "../api/market.js";
import { watchlistApi } from "../api/watchlist.js";
import { queryKeys } from "../lib/queryClient.js";
import { toast } from "../lib/toast.js";
import { normalizeApiError } from "../lib/errors.js";
import { formatCurrency, formatPercentage } from "../lib/format.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
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
  const reduce = useReducedMotion();

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

  const changePositive = Number(quote.data?.change ?? 0) >= 0;

  return (
    <motion.div className="space-y-6" variants={staggerParent()} initial={reduce ? false : "hidden"} animate="show">
      <motion.div variants={fadeUp}>
        <Card>
          {instrument.isLoading ? <Skeleton className="h-16" /> : instrument.isError ? (
            <ErrorState message="Instrument failed to load." onRetry={() => instrument.refetch()} />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate font-display text-xl font-bold text-white">
                  {instrument.data?.name}{" "}
                  <span className="font-mono text-sm font-semibold text-slate-500">({instrument.data?.symbol})</span>
                </h1>
                <p className="mt-1 text-xs text-slate-500">{instrument.data?.exchange} · {instrument.data?.sector} · {instrument.data?.currency ?? "INR"}</p>
                {quote.isLoading ? (
                  <Skeleton className="mt-3 h-9 w-44" />
                ) : quote.isError ? (
                  <p className="mt-3 text-xs text-rose-300">Quote unavailable — retrying automatically. <button type="button" className="underline underline-offset-4" onClick={() => quote.refetch()}>Retry</button></p>
                ) : quote.data ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <p className="font-display text-3xl font-bold tabular-nums tnum text-white">
                      {formatCurrency(quote.data.currentPrice, instrument.data?.currency)}
                    </p>
                    <Badge tone={changePositive ? "positive" : "negative"} dot className="font-mono tabular-nums tnum">
                      {formatPercentage(quote.data.changePercent)}
                    </Badge>
                  </div>
                ) : null}
              </div>
              <Button
                variant="ghost"
                type="button"
                disabled={toggleWatch.isPending}
                onClick={() => toggleWatch.mutate()}
                aria-pressed={watched}
                aria-label="Toggle watchlist"
                className={watched ? "shrink-0 border-amber-500/30 text-amber-200" : "shrink-0"}
              >
                <Star size={16} aria-hidden className={watched ? "fill-amber-300 text-amber-300" : undefined} />
                {watched ? "Watching" : "Watch"}
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Price</h2>
            <Badge tone="neutral">1D · 1M</Badge>
          </div>
          {history.isLoading ? <Skeleton className="h-64" /> : history.isError ? (
            <ErrorState message="Price history failed to load." onRetry={() => history.refetch()} />
          ) : history.data?.length ? <PriceChart data={history.data} currency={instrument.data?.currency} /> : <EmptyState title="No price history." hint="Try again in a moment." />}
          <a href="#trade" className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-ink-800 px-4 py-2 font-sans text-sm font-semibold text-slate-100 ring-1 ring-white/10 transition-colors hover:bg-ink-700 focus-visible:outline-2 focus-visible:outline-indigo-500 md:hidden">
            Jump to trade
          </a>
        </Card>
        <Card id="trade" className="scroll-mt-24 md:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-sm font-semibold text-white">Trade</h2>
            <Badge tone="info">Paper</Badge>
          </div>
          {quote.data ? (
            <OrderForm symbol={symbol} currentPrice={quote.data.currentPrice} currency={instrument.data?.currency} />
          ) : quote.isLoading ? <Skeleton className="h-48" /> : <EmptyState title="Quote unavailable." hint="Trading resumes when the quote loads." />}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-6 md:grid-cols-2">
        <Card><SentimentScorecard symbol={symbol} /></Card>
        <Card><AlertForm symbol={symbol} /></Card>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="mb-3 font-display text-sm font-semibold text-white">Sentiment timeline</h2>
          <SentimentTimeline symbol={symbol} />
        </Card>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="mb-3 font-display text-sm font-semibold text-white">News</h2>
          <NewsList symbol={symbol} />
        </Card>
      </motion.div>
    </motion.div>
  );
}
