import { EmptyState } from "../ui.jsx";

// Dev2-owned slot: stock news (GET /news/:symbol) and global news (GET /news).
export default function NewsList({ symbol }) {
  return <EmptyState title={symbol ? `News — ${symbol}` : "News"} hint="Developer 2: wire GET /news here." />;
}
