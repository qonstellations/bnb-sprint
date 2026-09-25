import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ordersApi } from "../api/orders.js";
import { queryKeys } from "../lib/queryClient.js";
import { normalizeApiError } from "../lib/errors.js";
import { toast } from "../lib/toast.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";
import { Badge, Card, EmptyState, ErrorState, Modal, Skeleton } from "../components/ui.jsx";

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="py-1">Time</th><th>Symbol</th><th>Side</th><th>Type</th><th>Qty</th><th>Price</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-slate-800">
                    <td className="py-2 text-xs">{formatDateTime(o.createdAt)}</td>
                    <td><Link to={`/stocks/${o.symbol}`} className="font-medium hover:underline">{o.symbol}</Link></td>
                    <td>{o.side}</td>
                    <td>{o.type}</td>
                    <td>{o.quantity}</td>
                    <td>{formatCurrency(o.averageFillPrice ?? o.limitPrice)}</td>
                    <td><Badge tone={o.status === "FILLED" ? "positive" : o.status === "OPEN" ? "info" : "neutral"}>{o.status}</Badge></td>
                    <td>{o.status === "OPEN" ? <button type="button" onClick={() => { cancel.reset(); setConfirmId(o._id); }} className="text-xs text-rose-300 underline">Cancel</button> : null}</td>
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
          <button type="button" onClick={() => setConfirmId(null)} className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm">Keep</button>
          <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate(confirmId)} className="flex-1 rounded-lg bg-rose-700 px-3 py-2 text-sm text-white">
            {cancel.isPending ? "Cancelling…" : "Cancel order"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
