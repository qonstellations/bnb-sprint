import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { Pencil, Trash2 } from "lucide-react";
import { alertsApi } from "../api/alerts.js";
import { queryKeys } from "../lib/queryClient.js";
import { normalizeApiError } from "../lib/errors.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";
import { pushToast } from "../lib/toast.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
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
  const reduce = useReducedMotion();
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
    <motion.div
      variants={staggerParent()}
      initial={reduce ? false : "hidden"}
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-xl font-bold text-white">Alerts</h1>
        <p className="mt-0.5 text-sm text-slate-500">Target and stop-loss rules with instant triggers.</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="mb-3 font-display text-sm font-semibold text-white">New alert</h2>
          <AlertForm />
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="mb-3 font-display text-sm font-semibold text-white">Rules</h2>
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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="font-mono text-[13px] font-medium text-slate-100">{r.symbol}</span>
                    <span className="text-xs text-slate-500">{r.type}</span>
                    <span className="font-mono text-[13px] tabular-nums tnum text-slate-300">@ {formatCurrency(r.triggerPrice)}</span>
                    <Badge tone={statusTone(r.status)} dot>{r.status ?? "UNKNOWN"}</Badge>
                  </span>
                  <span className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => openEdit(r)}
                      aria-label={`Edit ${r.symbol} alert`}
                      className="h-8 w-8 px-0 [min-height:0]"
                    >
                      <Pencil size={14} aria-hidden />
                    </Button>
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => {
                        deleteRule.reset();
                        setDeleting(r);
                      }}
                      aria-label={`Delete ${r.symbol} alert`}
                      className="h-8 w-8 bg-transparent px-0 text-rose-300 ring-1 ring-rose-500/25 hover:bg-rose-500/10 hover:text-rose-200 [min-height:0]"
                    >
                      <Trash2 size={14} aria-hidden />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {deleteError ? <p className="mt-2 text-xs text-rose-300">{deleteError}</p> : null}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="mb-3 font-display text-sm font-semibold text-white">Triggered</h2>
          {events.isLoading ? (
            <Skeleton className="h-16" />
          ) : events.isError ? (
            <ErrorState message={normalizeApiError(events.error).message} onRetry={() => events.refetch()} />
          ) : (events.data ?? []).length === 0 ? (
            <EmptyState title="No triggered alerts." hint="Triggered rules will appear here." />
          ) : (
            <ul className="space-y-2 text-sm">
              {(events.data ?? []).map((e, i) => (
                <li key={e.ruleId ?? i} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                  <p className="text-slate-200">{e.message ?? "Alert triggered"}</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums tnum text-slate-500">
                    {e.symbol ?? ""} · {formatDateTime(e.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <NewsList />
        </Card>
      </motion.div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit alert rule">
        <form onSubmit={submitEdit} className="space-y-3">
          <p className="font-mono text-[13px] text-slate-400">
            {editing?.symbol} · {editing?.type}
          </p>
          <Input
            label="Trigger price"
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
            <Button variant="secondary" type="button" onClick={() => setEditing(null)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={updateRule.isPending} className="flex-1">
              {updateRule.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete alert rule">
        <p className="text-sm leading-relaxed text-slate-400">
          Delete {deleting?.symbol} · {deleting?.type} @ {deleting?.triggerPrice}?
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" type="button" onClick={() => setDeleting(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={() => deleteRule.mutate(deleting._id)}
            disabled={deleteRule.isPending}
            className="flex-1"
          >
            {deleteRule.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
