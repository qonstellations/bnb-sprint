import { useQuery } from "@tanstack/react-query";
import { sentimentApi } from "../../api/sentiment.js";
import { queryKeys } from "../../lib/queryClient.js";
import { normalizeApiError } from "../../lib/errors.js";
import { formatPercentage } from "../../lib/format.js";
import { Badge, EmptyState, ErrorState, Skeleton } from "../ui.jsx";

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Sentiment — {symbol}</h3>
        <Badge tone={toneFor(sentiment.label)}>{label}</Badge>
      </div>
      <p className="text-2xl font-semibold">
        {typeof sentiment.score === "number" ? sentiment.score.toFixed(2) : "—"}
        <span className="ml-2 text-xs font-normal text-slate-400">score</span>
      </p>
      {breakdown ? (
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-800">
            {total > 0 ? (
              <>
                <div
                  className="bg-emerald-500"
                  style={{ width: `${((breakdown.bullish ?? 0) / total) * 100}%` }}
                />
                <div
                  className="bg-slate-500"
                  style={{ width: `${((breakdown.neutral ?? 0) / total) * 100}%` }}
                />
                <div
                  className="bg-rose-500"
                  style={{ width: `${((breakdown.bearish ?? 0) / total) * 100}%` }}
                />
              </>
            ) : null}
          </div>
          <p>
            Bullish {breakdown.bullish ?? 0} · Neutral {breakdown.neutral ?? 0} ·
            Bearish {breakdown.bearish ?? 0}
            {articles != null ? ` · ${articles} articles` : ""}
            {priceChange != null ? ` · price ${formatPercentage(priceChange)}` : ""}
          </p>
        </div>
      ) : null}
      <p className="text-[11px] text-slate-500">Informational only — not investment advice.</p>
    </div>
  );
}
