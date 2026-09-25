import { useQuery } from "@tanstack/react-query";
import { newsApi } from "../../api/news.js";
import { queryKeys } from "../../lib/queryClient.js";
import { normalizeApiError } from "../../lib/errors.js";
import { formatDateTime } from "../../lib/format.js";
import { Badge, EmptyState, ErrorState, Skeleton } from "../ui.jsx";

function toneFor(label) {
  const v = String(label ?? "").toUpperCase();
  if (v === "BULLISH") return "positive";
  if (v === "BEARISH") return "negative";
  return "neutral";
}

function displayLabel(label) {
  const v = String(label ?? "").toUpperCase();
  if (v === "BULLISH") return "Bullish";
  if (v === "BEARISH") return "Bearish";
  if (v === "NEUTRAL") return "Neutral";
  return null;
}

// Dev2: news — GET /news/:symbol on stock page, GET /news on /alerts.
// Missing-meta safe: headline/source/time/link/sentiment all optional upstream.
export default function NewsList({ symbol, limit = 10 }) {
  const query = useQuery({
    queryKey: queryKeys.news(symbol ?? "all"),
    queryFn: () =>
      symbol ? newsApi.bySymbol(symbol, { limit }) : newsApi.list({ limit }),
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

  const raw = query.data;
  const articles = Array.isArray(raw) ? raw : (raw?.articles ?? []);
  if (articles.length === 0) {
    return (
      <EmptyState
        title={symbol ? `No news for ${symbol}.` : "No news."}
        hint="Check back later."
      />
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{symbol ? `News — ${symbol}` : "Latest news"}</h3>
      <ul className="space-y-3">
        {articles.slice(0, limit).map((a, i) => {
          const label = displayLabel(a?.sentiment?.label);
          const key = a?.url ?? a?.headline ?? i;
          const body = (
            <>
              <span className="text-sm font-medium text-slate-100">
                {a?.headline ?? "Untitled"}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{a?.source ?? "Unknown source"}</span>
                <span>·</span>
                <span>{formatDateTime(a?.publishedAt)}</span>
                {label ? <Badge tone={toneFor(a.sentiment.label)}>{label}</Badge> : null}
              </span>
            </>
          );
          return (
            <li key={key} className="flex flex-col">
              {a?.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col hover:underline"
                >
                  {body}
                </a>
              ) : (
                <div className="flex flex-col">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
