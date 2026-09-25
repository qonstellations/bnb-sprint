import { useEffect, useState } from "react";
import { toast } from "../lib/toast.js";

const TONES = {
  success: "border-emerald-800 bg-emerald-950/90 text-emerald-100",
  error: "border-rose-800 bg-rose-950/90 text-rose-100",
  info: "border-slate-700 bg-slate-900/95 text-slate-100",
};

const DISMISS_MS = 4000;

// Lives inside AppShell's #toast-area. Polite live region, auto-dismiss, manual close.
export default function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return toast.subscribe((event) => {
      if (event.type === "push") {
        setItems((prev) => [...prev.slice(-3), event.toast]);
        window.setTimeout(() => toast.dismiss(event.toast.id), DISMISS_MS);
      } else if (event.type === "dismiss") {
        setItems((prev) => prev.filter((t) => t.id !== event.id));
      } else if (event.type === "clear") {
        setItems([]);
      }
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-lg backdrop-blur ${TONES[t.tone] ?? TONES.info}`}
        >
          <p className="flex-1">{t.message}</p>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Dismiss notification"
            className="rounded px-1.5 py-0.5 text-xs opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
