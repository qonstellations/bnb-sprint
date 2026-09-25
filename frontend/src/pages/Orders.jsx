import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ordersApi } from "../api/orders.js";
import { queryKeys } from "../lib/queryClient.js";
import { normalizeApiError } from "../lib/errors.js";
import { toast } from "../lib/toast.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";
import { Badge, Button, Card, EmptyState, ErrorState, Modal, Skeleton } from "../components/ui.jsx";

// Dev1 orders page per PLAN Sec 15. Status enums follow API.md; only OPEN is cancellable.
const STATUS_FILTERS = ["ALL", "OPEN", "FILLED", "CANCELLED"];

export default function Orders() {
  const queryClient = useQueryClient();
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Orders</h1>
        <div className="flex gap-1 rounded-lg bg-slate-900 p-1" role="tablist" aria-label="Filter orders by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                status === s ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <Card>
        {list.isLoading ? <Skeleton className="h-24" /> : list.isError ? (
          <ErrorState message="Orders failed to load." onRetry={() => list.refetch()} />
        ) : orders.length === 0 ? (
          <EmptyState
            title={status === "ALL" ? "No orders yet." : `No ${status.toLowerCase()} orders.`}
            hint={status === "ALL" ? "Place a paper trade from a stock page." : "Try a different status filter."}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-170 text-left text-sm tabular-nums">
              <thead className="sticky top-0 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="py-2 pr-3">Time</th><th className="pr-3">Symbol</th><th className="pr-3">Side</th><th className="pr-3">Type</th><th className="pr-3 text-right">Qty</th><th className="pr-3 text-right">Price</th><th className="pr-3">Status</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-slate-800 hover:bg-slate-800/40">
                    <td className="py-2 pr-3 text-xs text-slate-400">{formatDateTime(o.createdAt)}</td>
                    <td className="pr-3"><Link to={`/stocks/${o.symbol}`} className="rounded font-medium hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">{o.symbol}</Link></td>
                    <td className={`pr-3 font-medium ${o.side === "BUY" ? "text-emerald-300" : "text-rose-300"}`}>{o.side}</td>
                    <td className="pr-3 text-slate-300">{o.type}</td>
                    <td className="pr-3 text-right">{o.quantity}</td>
                    <td className="pr-3 text-right">{formatCurrency(o.averageFillPrice ?? o.limitPrice)}</td>
                    <td className="pr-3"><Badge tone={o.status === "FILLED" ? "positive" : o.status === "OPEN" ? "info" : "neutral"}>{o.status}</Badge></td>
                    <td>{o.status === "OPEN" ? <Button variant="link" type="button" onClick={() => { cancel.reset(); setConfirmId(o._id); }}>Cancel</Button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Cancel order?">
        <p className="text-sm text-slate-300">Only OPEN limit orders can be cancelled.</p>
        {cancel.error ? <p className="mt-2 text-xs text-rose-300">{normalizeApiError(cancel.error).message}</p> : null}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" type="button" onClick={() => setConfirmId(null)} className="flex-1">Keep</Button>
          <Button variant="danger" type="button" disabled={cancel.isPending} onClick={() => cancel.mutate(confirmId)} className="flex-1">
            {cancel.isPending ? "Cancelling…" : "Cancel order"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
