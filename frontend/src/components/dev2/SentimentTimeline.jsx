import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CartesianGrid } from "recharts";
import { useReducedMotion } from "motion/react";
import { marketApi } from "../../api/market.js";
import { sentimentApi } from "../../api/sentiment.js";
import { queryKeys } from "../../lib/queryClient.js";
import { normalizeApiError } from "../../lib/errors.js";
import { EmptyState, ErrorState, Skeleton } from "../ui.jsx";

function dayKey(value) {
  return new Date(value).toLocaleDateString();
}

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-xs shadow-card backdrop-blur">
      <p className="font-medium text-slate-200">{label}</p>
      {row.close != null ? <p className="text-slate-400">Close: {row.close}</p> : null}
      {row.sentimentLabel ? (
        <p className="text-slate-300">
          {row.sentimentLabel}
          {typeof row.sentimentScore === "number" ? ` (${row.sentimentScore.toFixed(2)})` : ""}
          {row.sentimentArticles != null ? ` · ${row.sentimentArticles} articles` : ""}
        </p>
      ) : (
        <p className="text-slate-500">No sentiment marker</p>
      )}
    </div>
  );
}

// Dev2: price + sentiment timeline — GET /market/history + /sentiment/:symbol/history.
// Markers show association only; sentiment does not predict price.
export default function SentimentTimeline({ symbol }) {
  const reduce = useReducedMotion();
  const price = useQuery({
    queryKey: queryKeys.history(symbol, { range: "1m" }),
    queryFn: () => marketApi.history(symbol, { range: "1m", interval: "1d" }),
    enabled: !!symbol,
  });
  const sentiment = useQuery({
    queryKey: queryKeys.sentimentHistory(symbol),
    queryFn: () => sentimentApi.history(symbol, { range: "7d" }),
    enabled: !!symbol,
  });

  const rows = useMemo(() => {
    const prices = Array.isArray(price.data) ? price.data : [];
    const moods = Array.isArray(sentiment.data) ? sentiment.data : [];
    const moodByDay = new Map(moods.map((m) => [dayKey(m.timestamp), m]));
    return prices.map((p) => {
      const mood = moodByDay.get(dayKey(p.timestamp ?? p.date));
      return {
        t: dayKey(p.timestamp ?? p.date),
        close: p.close ?? p.value ?? null,
        sentimentLabel: mood
          ? String(mood.label ?? "").charAt(0) + String(mood.label ?? "").slice(1).toLowerCase()
          : null,
        sentimentScore: mood?.score ?? null,
        sentimentArticles: mood?.articles ?? null,
        // Scatter marker sits on the price line where a sentiment reading exists.
        marker: mood ? (p.close ?? p.value ?? null) : null,
      };
    });
  }, [price.data, sentiment.data]);

  if (price.isLoading || sentiment.isLoading) return <Skeleton className="h-64" />;
  if (price.isError || sentiment.isError) {
    return (
      <ErrorState
        message={normalizeApiError(price.error ?? sentiment.error).message}
        onRetry={() => {
          price.refetch();
          sentiment.refetch();
        }}
      />
    );
  }
  if (rows.length === 0) {
    return <EmptyState title={`No timeline for ${symbol}.`} />;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-semibold text-white">Price + sentiment — {symbol}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgb(255 255 255 / 0.06)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 11, fill: "#7d8aa0" }}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#7d8aa0" }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              width={56}
            />
            <Tooltip
              content={<TimelineTooltip />}
              cursor={{ stroke: "rgb(255 255 255 / 0.15)" }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#818cf8"
              strokeWidth={2}
              dot={false}
              name="Close"
              isAnimationActive={!reduce}
              animationDuration={700}
              animationEasing="ease-out"
            />
            <Scatter dataKey="marker" fill="#fbbf24" name="Sentiment" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-slate-500">
        Dots mark days with sentiment readings. Association only — not predictive.
      </p>
    </div>
  );
}
