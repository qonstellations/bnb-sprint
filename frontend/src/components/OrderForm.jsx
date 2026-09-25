import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { ordersApi } from "../api/orders.js";
import { portfolioApi } from "../api/portfolio.js";
import { normalizeApiError } from "../lib/errors.js";
import { queryKeys } from "../lib/queryClient.js";
import { toast } from "../lib/toast.js";
import { formatCurrency } from "../lib/format.js";
import { Button, Input, Modal } from "./ui.jsx";

// Dev1 trading panel per PLAN Sec 13-14: BUY/SELL, MARKET/LIMIT, quantity,
// limit price only for LIMIT, confirmation modal, post-trade invalidation.
export default function OrderForm({ symbol, currentPrice, currency = "INR" }) {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
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

  const sideActiveClass =
    side === "BUY"
      ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
      : "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30";

  return (
    <form onSubmit={openConfirm} className="space-y-4">
      <div
        className="grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.03] p-1 ring-1 ring-white/10"
        role="group"
        aria-label="Order side"
      >
        {["BUY", "SELL"].map((s) => {
          const active = side === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => setSide(s)}
              className={`relative min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                active ? sideActiveClass : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {active && !reduce ? (
                <motion.span
                  layoutId="order-side-active"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  className={`absolute inset-0 rounded-xl ${side === "BUY" ? "bg-emerald-500/15 ring-1 ring-emerald-500/30" : "bg-rose-500/15 ring-1 ring-rose-500/30"}`}
                  aria-hidden
                />
              ) : null}
              <span className="relative">{s}</span>
            </button>
          );
        })}
      </div>
      <div
        className="grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.03] p-1 ring-1 ring-white/10"
        role="group"
        aria-label="Order type"
      >
        {["MARKET", "LIMIT"].map((t) => {
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => setType(t)}
              className={`relative min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                active ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {active && !reduce ? (
                <motion.span
                  layoutId="order-type-active"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  className="absolute inset-0 rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30"
                  aria-hidden
                />
              ) : null}
              <span className="relative">{t}</span>
            </button>
          );
        })}
      </div>
      <Input
        label="Quantity"
        id="order-quantity"
        name="order-quantity"
        type="number"
        min="1"
        step="1"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="1"
        aria-label="Quantity"
      />
      {type === "LIMIT" ? (
        <Input
          label="Limit price"
          id="order-limit-price"
          name="order-limit-price"
          type="number"
          min="0"
          step="any"
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
          placeholder="0.00"
          aria-label="Limit price"
        />
      ) : null}
      <dl className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Price</dt>
          <dd className="font-mono tabular-nums text-slate-300">{formatCurrency(currentPrice, currency)}</dd>
        </div>
        {summary ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Cash</dt>
            <dd className="font-mono tabular-nums text-slate-300">{formatCurrency(summary.cash, currency)}</dd>
          </div>
        ) : null}
        {estimated != null ? (
          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-1.5">
            <dt className="text-slate-500">Est. value</dt>
            <dd className="font-mono tabular-nums text-white">{formatCurrency(estimated, currency)}</dd>
          </div>
        ) : null}
      </dl>
      {formError ? <p className="text-xs text-rose-300">{formError}</p> : null}
      <Button type="submit" className="w-full">
        Review {side} {symbol}
      </Button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm order">
        <div className="space-y-1 text-sm">
          <p className="text-slate-200">
            {side} <span className="font-mono tabular-nums">{quantity}</span> ×{" "}
            <span className="font-mono font-semibold">{symbol}</span>{" "}
            <span className="text-slate-500">({type})</span>
          </p>
          {type === "LIMIT" ? (
            <p className="text-slate-400">
              Limit: <span className="font-mono tabular-nums text-slate-200">{formatCurrency(Number(limitPrice), currency)}</span>
            </p>
          ) : null}
          {estimated != null ? (
            <p className="text-slate-400">
              Est. value: <span className="font-mono tabular-nums text-slate-200">{formatCurrency(estimated, currency)}</span>
            </p>
          ) : null}
          <p className="text-xs text-slate-500">Paper trade — virtual money only.</p>
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
