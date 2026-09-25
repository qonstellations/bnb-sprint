import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ordersApi } from "../api/orders.js";
import { queryKeys } from "../lib/queryClient.js";
import { normalizeApiError } from "../lib/errors.js";
import { toast } from "../lib/toast.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
import { Badge, Button, Card, EmptyState, ErrorState, Modal, Skeleton } from "../components/ui.jsx";

// Dev1 orders page per PLAN Sec 15. Status enums follow API.md; only OPEN is cancellable.
const STATUS_FILTERS = ["ALL", "OPEN", "FILLED", "CANCELLED"];

function statusTone(status) {
  if (status === "FILLED") return "positive";
  if (status === "OPEN") return "info";
  return "neutral";
}

export default function Orders() {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [confirmId, setConfirmId] = useState(null);
  const [status, setStatus] = useState("ALL");
  const filters = status === "ALL" ? { page: 1, limit: 20 } : { page: 1, limit: 20, status };
  const list = useQuery({ queryKey: queryKeys.orders(filters), queryFn: () => ordersApi.list(filters) });

  const cancel = useMutation({
    mutationFn: (id) => ordersApi.cancel(id),
    onSuccess: () => {
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSummary() });
      toast.success("Order cancelled.");
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  const orders = list.data?.orders ?? list.data ?? [];

  return (
    <motion.div
      variants={staggerParent()}
      initial={reduce ? false : "hidden"}
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500">Review fills and manage open limit orders.</p>
        </div>
        <div
          className="flex gap-1 rounded-2xl bg-white/[0.03] p-1 ring-1 ring-white/10"
          role="tablist"
          aria-label="Filter orders by status"
        >
          {STATUS_FILTERS.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(s)}
                className={`relative rounded-xl px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                  active ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="orders-status-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/10"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-10">
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="p-0">
          {list.isLoading ? (
            <div className="p-5"><Skeleton className="h-24" /></div>
          ) : list.isError ? (
            <div className="p-5">
              <ErrorState message="Orders failed to load." onRetry={() => list.refetch()} />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={status === "ALL" ? "No orders yet." : `No ${status.toLowerCase()} orders.`}
                hint={status === "ALL" ? "Place a paper trade from a stock page." : "Try a different status filter."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="sticky top-0 bg-ink-900">
                  <tr>
                    <th className="py-3 pl-5 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Time</th>
                    <th className="py-3 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Symbol</th>
                    <th className="py-3 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Side</th>
                    <th className="py-3 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="py-3 pr-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="py-3 pr-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Price</th>
                    <th className="py-3 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="py-3 pl-3 pr-5"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const buy = o.side === "BUY";
                    return (
                      <tr key={o._id} className="border-t border-white/5 transition-colors hover:bg-white/[0.02]">
                        <td className="py-2.5 pl-5 pr-3 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
                        <td className="py-2.5 pr-3">
                          <Link
                            to={`/stocks/${o.symbol}`}
                            className="rounded font-mono text-[13px] font-medium text-slate-100 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo-500"
                          >
                            {o.symbol}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${buy ? "text-emerald-300" : "text-rose-300"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${buy ? "bg-emerald-400" : "bg-rose-400"}`} aria-hidden />
                            {o.side}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-400">{o.type}</td>
                        <td className="py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums tnum text-slate-200">{o.quantity}</td>
                        <td className="py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums tnum text-slate-200">{formatCurrency(o.averageFillPrice ?? o.limitPrice)}</td>
                        <td className="py-2.5 pr-3">
                          <Badge tone={statusTone(o.status)} dot>{o.status}</Badge>
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right">
                          {o.status === "OPEN" ? (
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => { cancel.reset(); setConfirmId(o._id); }}
                              className="h-8 px-3 py-1 text-xs [min-height:0]"
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Cancel order?">
        <p className="text-sm leading-relaxed text-slate-400">This will cancel the open limit order. Filled orders cannot be cancelled.</p>
        {cancel.error ? <p className="mt-2 text-xs text-rose-300">{normalizeApiError(cancel.error).message}</p> : null}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" type="button" onClick={() => setConfirmId(null)} className="flex-1">Keep</Button>
          <Button variant="danger" type="button" disabled={cancel.isPending} onClick={() => cancel.mutate(confirmId)} className="flex-1">
            {cancel.isPending ? "Cancelling…" : "Cancel order"}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
