import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../../api/alerts.js";
import { normalizeApiError } from "../../lib/errors.js";
import { Button, Input } from "../ui.jsx";

// UI labels per PLAN; API types per API.md (STOP_LOSS documented, TAKE_PROFIT symmetric).
const TYPE_OPTIONS = [
  { label: "Target", value: "TAKE_PROFIT" },
  { label: "Stop-loss", value: "STOP_LOSS" },
];

// Dev2: create price-alert rules — POST /alerts/rules.
export default function AlertForm({ symbol: defaultSymbol = "" }) {
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
    <form onSubmit={submit} className="space-y-3">
      <h3 className="text-sm font-semibold">
        Price alerts{defaultSymbol ? ` — ${defaultSymbol}` : ""}
      </h3>
      <Input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Symbol (e.g. AAPL)"
        aria-label="Symbol"
      />
      <div className="grid grid-cols-2 gap-2">
        {TYPE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setType(o.value)}
            className={`rounded-lg px-3 py-2 text-sm ${
              type === o.value ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Input
        type="number"
        min="0"
        step="any"
        value={triggerPrice}
        onChange={(e) => setTriggerPrice(e.target.value)}
        placeholder="Trigger price"
        aria-label="Trigger price"
      />
      {formError ? <p className="text-xs text-rose-300">{formError}</p> : null}
      {serverError ? <p className="text-xs text-rose-300">{serverError}</p> : null}
      {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Creating…" : "Create alert"}
      </Button>
    </form>
  );
}
