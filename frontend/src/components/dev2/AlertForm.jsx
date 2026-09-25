import { EmptyState } from "../ui.jsx";

// Dev2-owned slot: alert create/edit (POST/PATCH /alerts/rules).
export default function AlertForm({ symbol }) {
  return <EmptyState title={`Price alerts — ${symbol}`} hint="Developer 2: wire alert rules here." />;
}
