import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { ExternalLink, Newspaper } from "lucide-react";
import { newsApi } from "../../api/news.js";
import { queryKeys } from "../../lib/queryClient.js";
import { normalizeApiError } from "../../lib/errors.js";
import { formatDateTime } from "../../lib/format.js";
import { fadeUp, staggerParent } from "../../lib/motion.js";
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
  const reduce = useReducedMotion();
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
        icon={Newspaper}
        title={symbol ? `No news for ${symbol}.` : "No news."}
        hint="Check back later."
      />
    );
  }

  return (
    <motion.div variants={fadeUp} initial={reduce ? false : "hidden"} animate="show">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 ring-1 ring-white/10">
          <Newspaper size={14} aria-hidden />
        </span>
        <h3 className="font-display text-sm font-semibold text-white">
          {symbol ? `News — ${symbol}` : "Latest news"}
        </h3>
      </div>
      <motion.ul
        variants={staggerParent(0.04)}
        initial={reduce ? false : "hidden"}
        animate="show"
        className="mt-4 space-y-1"
      >
        {articles.slice(0, limit).map((a, i) => {
          const label = displayLabel(a?.sentiment?.label);
          const key = a?.url ?? a?.headline ?? i;
          const headline = (
            <span
              className={`text-sm font-medium text-slate-100 ${
                a?.url ? "group-hover:underline group-hover:underline-offset-4" : ""
              }`}
            >
              {a?.headline ?? "Untitled"}
            </span>
          );
          const meta = (
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span>{a?.source ?? "Unknown source"}</span>
              <span aria-hidden>·</span>
              <span>{formatDateTime(a?.publishedAt)}</span>
              {label ? (
                <Badge tone={toneFor(a.sentiment.label)} dot>
                  {label}
                </Badge>
              ) : null}
            </span>
          );
          return (
            <motion.li
              key={key}
              variants={fadeUp}
              className="border-b border-white/5 py-3 first:pt-1 last:border-0 last:pb-0"
            >
              {a?.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start justify-between gap-3"
                >
                  <span className="flex min-w-0 flex-col">
                    {headline}
                    {meta}
                  </span>
                  <ExternalLink
                    size={12}
                    aria-hidden
                    className="mt-1 shrink-0 text-slate-500 transition-colors group-hover:text-slate-300"
                  />
                </a>
              ) : (
                <div className="flex flex-col">
                  {headline}
                  {meta}
                </div>
              )}
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}
