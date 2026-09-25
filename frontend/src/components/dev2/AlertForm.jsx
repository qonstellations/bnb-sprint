import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, BellRing, CheckCircle2 } from "lucide-react";
import { alertsApi } from "../../api/alerts.js";
import { normalizeApiError } from "../../lib/errors.js";
import { fadeUp, spring } from "../../lib/motion.js";
import { Button, Input } from "../ui.jsx";

// UI labels per PLAN; API types per API.md (STOP_LOSS documented, TAKE_PROFIT symmetric).
const TYPE_OPTIONS = [
  { label: "Target", value: "TAKE_PROFIT" },
  { label: "Stop-loss", value: "STOP_LOSS" },
];

// Dev2: create price-alert rules — POST /alerts/rules.
export default function AlertForm({ symbol: defaultSymbol = "" }) {
  const reduce = useReducedMotion();
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [type, setType] = useState("TAKE_PROFIT");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const mutation = useMutation({
    mutationFn: (body) => alertsApi.createRule(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
      setTriggerPrice("");
      setSuccess("Alert rule created.");
    },
  });

  function submit(e) {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    mutation.reset();
    const sym = symbol.trim().toUpperCase();
    const px = Number(triggerPrice);
    if (!sym) {
      setFormError("Symbol is required.");
      return;
    }
    if (!triggerPrice || Number.isNaN(px) || px <= 0) {
      setFormError("Trigger price must be a positive number.");
      return;
    }
    mutation.mutate({ symbol: sym, type, triggerPrice: px });
  }

  const serverError = mutation.error ? normalizeApiError(mutation.error).message : "";

  return (
    <motion.form
      onSubmit={submit}
      variants={fadeUp}
      initial={reduce ? false : "hidden"}
      animate="show"
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 ring-1 ring-white/10">
          <BellRing size={14} aria-hidden />
        </span>
        <h3 className="font-display text-sm font-semibold text-white">
          Price alerts{defaultSymbol ? ` — ${defaultSymbol}` : ""}
        </h3>
      </div>
      <Input
        label="Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Symbol (e.g. AAPL)"
        aria-label="Symbol"
      />
      <div
        role="group"
        aria-label="Alert type"
        className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10"
      >
        {TYPE_OPTIONS.map((o) => {
          const active = type === o.value;
          const isTarget = o.value === "TAKE_PROFIT";
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setType(o.value)}
              aria-pressed={active}
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? isTarget
                    ? "text-emerald-200"
                    : "text-rose-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="alert-type-pill"
                  transition={reduce ? { duration: 0 } : spring}
                  className={`absolute inset-0 rounded-lg ring-1 ${
                    isTarget
                      ? "bg-emerald-500/15 ring-emerald-500/30"
                      : "bg-rose-500/15 ring-rose-500/30"
                  }`}
                />
              ) : null}
              <span className="relative z-10">{o.label}</span>
            </button>
          );
        })}
      </div>
      <Input
        label="Trigger price"
        type="number"
        min="0"
        step="any"
        value={triggerPrice}
        onChange={(e) => setTriggerPrice(e.target.value)}
        placeholder="Trigger price"
        aria-label="Trigger price"
      />
      {formError ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-300">
          <AlertTriangle size={14} aria-hidden className="shrink-0" />
          {formError}
        </p>
      ) : null}
      {serverError ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-300">
          <AlertTriangle size={14} aria-hidden className="shrink-0" />
          {serverError}
        </p>
      ) : null}
      {success ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-300">
          <CheckCircle2 size={14} aria-hidden className="shrink-0" />
          {success}
        </p>
      ) : null}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Creating…" : "Create alert"}
      </Button>
    </motion.form>
  );
}
