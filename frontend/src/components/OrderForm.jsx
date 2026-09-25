import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders.js";
import { portfolioApi } from "../api/portfolio.js";
import { normalizeApiError } from "../lib/errors.js";
import { queryKeys } from "../lib/queryClient.js";
import { toast } from "../lib/toast.js";
import { formatCurrency } from "../lib/format.js";
import { Button, Input, Modal } from "./ui.jsx";

// Dev1 trading panel per PLAN Sec 13-14: BUY/SELL, MARKET/LIMIT, quantity,
// limit price only for LIMIT, confirmation modal, post-trade invalidation.
export default function OrderForm({ symbol, currentPrice, currency = "USD" }) {
  const queryClient = useQueryClient();
  const [side, setSide] = useState("BUY");
  const [type, setType] = useState("MARKET");
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: summary } = useQuery({
    queryKey: queryKeys.portfolioSummary(),
    queryFn: portfolioApi.summary,
  });

  const qty = Number(quantity);
  const estimated = useMemo(() => {
    const px = type === "LIMIT" ? Number(limitPrice) : Number(currentPrice);
    if (!qty || qty <= 0 || !px) return null;
    return qty * px;
  }, [qty, limitPrice, currentPrice, type]);

  const mutation = useMutation({
    mutationFn: (body) => ordersApi.create(body),
    onSuccess: (data, variables) => {
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioPerformance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioAllocation() });
      const status = data?.order?.status ?? (variables.type === "LIMIT" ? "OPEN" : "FILLED");
      toast.success(
        status === "OPEN"
          ? `${variables.side} ${variables.quantity} × ${variables.symbol} placed (OPEN).`
          : `${variables.side} ${variables.quantity} × ${variables.symbol} filled.`
      );
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  function openConfirm(e) {
    e.preventDefault();
    setFormError("");
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      // Backend rejects fractional shares; catch it here so the modal never opens invalid.
      setFormError("Quantity must be a positive whole number.");
      return;
    }
    if (type === "LIMIT" && (!Number(limitPrice) || Number(limitPrice) <= 0)) {
      setFormError("Limit price is required for LIMIT orders.");
      return;
    }
    setConfirmOpen(true);
  }

  function submit() {
    mutation.reset();
    mutation.mutate({
      symbol,
      side,
      type,
      quantity: qty,
      limitPrice: type === "LIMIT" ? Number(limitPrice) : null,
      // Fresh id per confirm: safe retry after DUPLICATE_ORDER gets a new identity.
      clientOrderId: `order_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    });
  }

  const serverError = mutation.error ? normalizeApiError(mutation.error).message : "";

  return (
    <form onSubmit={openConfirm} className="space-y-3">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Order side">
        {["BUY", "SELL"].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={side === s}
            onClick={() => setSide(s)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
              side === s
                ? s === "BUY"
                  ? "bg-emerald-700 text-white"
                  : "bg-rose-700 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Order type">
        {["MARKET", "LIMIT"].map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
              type === t ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <Input
        type="number"
        min="1"
        step="1"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity"
        aria-label="Quantity"
      />
      {type === "LIMIT" ? (
        <Input
          type="number"
          min="0"
          step="any"
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
          placeholder="Limit price"
          aria-label="Limit price"
        />
      ) : null}
      <div className="text-xs text-slate-400">
        <p>Price: {formatCurrency(currentPrice, currency)}</p>
        {summary ? <p>Cash: {formatCurrency(summary.cash, currency)}</p> : null}
        {estimated != null ? <p>Est. value: {formatCurrency(estimated, currency)}</p> : null}
      </div>
      {formError ? <p className="text-xs text-rose-300">{formError}</p> : null}
      <Button type="submit" className="w-full">
        Review {side} {symbol}
      </Button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm order">
        <div className="space-y-1 text-sm">
          <p>{side} {quantity} × {symbol} ({type})</p>
          {type === "LIMIT" ? <p>Limit: {formatCurrency(Number(limitPrice), currency)}</p> : null}
          {estimated != null ? <p>Est. value: {formatCurrency(estimated, currency)}</p> : null}
          <p className="text-xs text-slate-400">Paper trade — virtual money only.</p>
          {serverError ? <p className="text-xs text-rose-300">{serverError}</p> : null}
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={mutation.isPending} className="flex-1">
            {mutation.isPending ? "Placing…" : "Confirm"}
          </Button>
        </div>
        {mutation.isSuccess ? (
          <p className="mt-2 text-xs text-emerald-300">Order placed.</p>
        ) : null}
      </Modal>
    </form>
  );
}
