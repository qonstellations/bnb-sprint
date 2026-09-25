import { useQuery } from "@tanstack/react-query";
import { alertsApi } from "../api/alerts.js";
import { queryKeys } from "../lib/queryClient.js";
import NewsList from "../components/dev2/NewsList.jsx";
import { Card, EmptyState, ErrorState, Skeleton } from "../components/ui.jsx";

// Alerts route scaffold. Dev2 owns rules/events; Dev1 keeps nav + route alive.
export default function Alerts() {
  const rules = useQuery({ queryKey: queryKeys.alertRules(), queryFn: alertsApi.rules });
  const events = useQuery({ queryKey: queryKeys.alerts(), queryFn: alertsApi.events });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">Alerts</h1>
      <Card>
        <h2 className="mb-2 text-sm font-semibold">Rules</h2>
        {rules.isLoading ? <Skeleton className="h-20" /> : rules.isError ? (
          <ErrorState message="Alert rules failed to load." onRetry={() => rules.refetch()} />
        ) : (rules.data ?? []).length === 0 ? (
          <EmptyState title="No alerts configured." hint="Developer 2: AlertForm creates target/stop-loss rules here." />
        ) : (
          <ul className="space-y-1 text-sm">
            {(rules.data ?? []).map((r) => (
              <li key={r._id} className="flex justify-between">
                <span>{r.symbol} · {r.type} @ {r.triggerPrice}</span>
                <span className="text-slate-500">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="mb-2 text-sm font-semibold">Triggered</h2>
        {events.isLoading ? <Skeleton className="h-16" /> : (events.data ?? []).length === 0 ? (
          <EmptyState title="No triggered alerts." />
        ) : (
          <ul className="space-y-1 text-sm">
            {(events.data ?? []).map((e, i) => (
              <li key={e.ruleId ?? i}>{e.message} · {e.symbol}</li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <NewsList />
      </Card>
    </div>
  );
}
