import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { Activity } from "lucide-react";
import { sentimentApi } from "../../api/sentiment.js";
import { queryKeys } from "../../lib/queryClient.js";
import { normalizeApiError } from "../../lib/errors.js";
import { formatPercentage } from "../../lib/format.js";
import { fadeUp } from "../../lib/motion.js";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "../ui.jsx";

function normalizeLabel(raw) {
  const v = String(raw ?? "").toUpperCase();
  if (v === "BULLISH") return "Bullish";
  if (v === "BEARISH") return "Bearish";
  return "Neutral";
}

function toneFor(raw) {
  const v = String(raw ?? "").toUpperCase();
  if (v === "BULLISH") return "positive";
  if (v === "BEARISH") return "negative";
  return "neutral";
}

// Dev2: sentiment scorecard — GET /sentiment/:symbol, Bullish/Neutral/Bearish only.
export default function SentimentScorecard({ symbol }) {
  const reduce = useReducedMotion();
  const query = useQuery({
    queryKey: queryKeys.sentiment(symbol),
    queryFn: () => sentimentApi.get(symbol),
    enabled: !!symbol,
  });

  if (query.isLoading) return <Skeleton className="h-32" />;
  if (query.isError) {
    return (
      <ErrorState
        message={normalizeApiError(query.error).message}
        onRetry={() => query.refetch()}
      />
    );
  }
  if (!query.data?.sentiment) {
    return <EmptyState title={`No sentiment for ${symbol}.`} />;
  }

  const { sentiment, breakdown, articles, priceChange } = query.data;
  const label = normalizeLabel(sentiment.label);
  const total =
    (breakdown?.bullish ?? 0) + (breakdown?.neutral ?? 0) + (breakdown?.bearish ?? 0);
  const pct = (n) => (total > 0 ? ((n ?? 0) / total) * 100 : 0);
  const rows = [
    { key: "bullish", label: "Bullish", count: breakdown?.bullish ?? 0, bar: "bg-emerald-400" },
    { key: "neutral", label: "Neutral", count: breakdown?.neutral ?? 0, bar: "bg-slate-400" },
    { key: "bearish", label: "Bearish", count: breakdown?.bearish ?? 0, bar: "bg-rose-400" },
  ];

  return (
    <motion.div variants={fadeUp} initial={reduce ? false : "hidden"} animate="show">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 ring-1 ring-white/10">
              <Activity size={14} aria-hidden />
            </span>
            <h3 className="font-display text-sm font-semibold text-white">
              Sentiment — {symbol}
            </h3>
          </div>
          <Badge tone={toneFor(sentiment.label)} dot>
            {label}
          </Badge>
        </div>

        <p className="mt-4 font-display text-4xl font-semibold text-white">
          <span className="font-mono tabular-nums">
            {typeof sentiment.score === "number" ? sentiment.score.toFixed(2) : "—"}
          </span>
          <span className="ml-2 align-middle font-sans text-xs font-normal text-slate-500">
            score
          </span>
        </p>

        {breakdown ? (
          <div className="mt-4 space-y-2.5">
            {rows.map((r) => (
              <div key={r.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {pct(r.count).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className={`h-full rounded-full ${r.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct(r.count)}%` }}
                    transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-slate-500">
              {articles != null ? (
                <span>
                  <span className="font-mono tabular-nums">{articles}</span> articles
                </span>
              ) : null}
              {articles != null && priceChange != null ? <span> · </span> : null}
              {priceChange != null ? (
                <span>
                  price{" "}
                  <span className="font-mono tabular-nums">
                    {formatPercentage(priceChange)}
                  </span>
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Informational only — not investment advice.
        </p>
      </Card>
    </motion.div>
  );
}
