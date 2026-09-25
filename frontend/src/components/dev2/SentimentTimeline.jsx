import { EmptyState } from "../ui.jsx";

// Dev2-owned slot: price + sentiment timeline (GET /market/history + /sentiment/:symbol/history).
export default function SentimentTimeline({ symbol }) {
  return <EmptyState title={`Price + sentiment timeline — ${symbol}`} hint="Developer 2: build synchronized timeline here." />;
}
