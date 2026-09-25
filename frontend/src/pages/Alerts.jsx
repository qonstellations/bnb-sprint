import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../api/alerts.js";
import { queryKeys } from "../lib/queryClient.js";
import { normalizeApiError } from "../lib/errors.js";
import { formatDateTime } from "../lib/format.js";
import { pushToast } from "../lib/toast.js";
import AlertForm from "../components/dev2/AlertForm.jsx";
import NewsList from "../components/dev2/NewsList.jsx";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Modal, Skeleton } from "../components/ui.jsx";

function statusTone(status) {
  const v = String(status ?? "").toUpperCase();
  if (v === "ACTIVE") return "info";
  if (v === "TRIGGERED") return "positive";
  if (v === "PAUSED") return "neutral";
  return "neutral";
}

function eventKey(e, i) {
  return e?.ruleId && e?.createdAt
    ? `${e.ruleId}:${e.createdAt}`
    : `${e?.message ?? "event"}:${i}`;
}

// Dev2-owned /alerts: rules (GET/PATCH/DELETE) + triggered events (GET, polled)
// + global news. Live toasts come from useLiveSocket; this polls as fallback.
export default function Alerts() {
  const queryClient = useQueryClient();
  const rules = useQuery({ queryKey: queryKeys.alertRules(), queryFn: alertsApi.rules });
  const events = useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: alertsApi.events,
    refetchInterval: 30_000,
  });

  const [editing, setEditing] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [deleting, setDeleting] = useState(null);

  // Fallback path: toast once per new triggered event seen via polling.
  const knownEvents = useRef(new Set());
  const primed = useRef(false);
  useEffect(() => {
    const list = events.data ?? [];
    if (!primed.current) {
      list.forEach((e, i) => knownEvents.current.add(eventKey(e, i)));
      primed.current = true;
      return;
    }
    list.forEach((e, i) => {
      const key = eventKey(e, i);
      if (!knownEvents.current.has(key)) {
        knownEvents.current.add(key);
        pushToast(e?.message ?? `Alert triggered: ${e?.symbol ?? ""}`, `poll:${key}`);
      }
    });
  }, [events.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
  };

  const updateRule = useMutation({
    mutationFn: ({ id, triggerPrice }) => alertsApi.updateRule(id, { triggerPrice }),
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
  });

  const deleteRule = useMutation({
    mutationFn: (id) => alertsApi.deleteRule(id),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
    },
  });

  function openEdit(rule) {
    updateRule.reset();
    setEditPrice(String(rule.triggerPrice ?? ""));
    setEditing(rule);
  }

  function submitEdit(e) {
    e.preventDefault();
    const px = Number(editPrice);
    if (!editPrice || Number.isNaN(px) || px <= 0) return;
    updateRule.mutate({ id: editing._id, triggerPrice: px });
  }

  const editError = updateRule.error ? normalizeApiError(updateRule.error).message : "";
  const deleteError = deleteRule.error ? normalizeApiError(deleteRule.error).message : "";

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">Alerts</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">New alert</h2>
        <AlertForm />
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">Rules</h2>
        {rules.isLoading ? (
          <Skeleton className="h-20" />
        ) : rules.isError ? (
          <ErrorState message={normalizeApiError(rules.error).message} onRetry={() => rules.refetch()} />
        ) : (rules.data ?? []).length === 0 ? (
          <EmptyState title="No alerts configured." hint="Create a target or stop-loss rule above." />
        ) : (
          <ul className="space-y-2 text-sm">
            {(rules.data ?? []).map((r) => (
              <li
                key={r._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{r.symbol}</span>
                  <span className="text-slate-400">{r.type}</span>
                  <span className="text-slate-300">@ {r.triggerPrice}</span>
                  <Badge tone={statusTone(r.status)}>{r.status ?? "UNKNOWN"}</Badge>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteRule.reset();
                      setDeleting(r);
                    }}
                    className="rounded-lg border border-rose-900 px-2.5 py-1 text-xs text-rose-200 hover:bg-rose-950"
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {deleteError ? <p className="mt-2 text-xs text-rose-300">{deleteError}</p> : null}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">Triggered</h2>
        {events.isLoading ? (
          <Skeleton className="h-16" />
        ) : events.isError ? (
          <ErrorState message={normalizeApiError(events.error).message} onRetry={() => events.refetch()} />
        ) : (events.data ?? []).length === 0 ? (
          <EmptyState title="No triggered alerts." />
        ) : (
          <ul className="space-y-2 text-sm">
            {(events.data ?? []).map((e, i) => (
              <li key={e.ruleId ?? i} className="rounded-lg border border-slate-800 px-3 py-2">
                <p className="text-slate-200">{e.message ?? "Alert triggered"}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {e.symbol ?? ""} · {formatDateTime(e.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <NewsList />
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit alert rule">
        <form onSubmit={submitEdit} className="space-y-3">
          <p className="text-sm text-slate-300">
            {editing?.symbol} · {editing?.type}
          </p>
          <Input
            type="number"
            min="0"
            step="any"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            placeholder="Trigger price"
            aria-label="Trigger price"
          />
          {editError ? <p className="text-xs text-rose-300">{editError}</p> : null}
          <div className="flex gap-2">
            <Button type="button" onClick={() => setEditing(null)} className="flex-1 bg-slate-700 hover:bg-slate-600">
              Cancel
            </Button>
            <Button type="submit" disabled={updateRule.isPending} className="flex-1">
              {updateRule.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete alert rule">
        <p className="text-sm text-slate-300">
          Delete {deleting?.symbol} · {deleting?.type} @ {deleting?.triggerPrice}?
        </p>
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={() => setDeleting(null)} className="flex-1 bg-slate-700 hover:bg-slate-600">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => deleteRule.mutate(deleting._id)}
            disabled={deleteRule.isPending}
            className="flex-1 bg-rose-700 hover:bg-rose-600"
          >
            {deleteRule.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
