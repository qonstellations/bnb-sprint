import { EmptyState } from "../ui.jsx";

// Dev2-owned slot. Dev1 mounts it; Dev2 implements sentiment scorecard here.
export default function SentimentScorecard({ symbol }) {
  return <EmptyState title={`Sentiment for ${symbol}`} hint="Developer 2: wire GET /sentiment/:symbol here." />;
}
