import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { toast } from "../lib/toast.js";

const TONES = {
  success: {
    classes: "border-emerald-500/25 bg-ink-850/95 text-emerald-100",
    Icon: CheckCircle2,
    iconClasses: "text-emerald-400",
  },
  error: {
    classes: "border-rose-500/25 bg-ink-850/95 text-rose-100",
    Icon: AlertTriangle,
    iconClasses: "text-rose-400",
  },
  info: {
    classes: "border-white/10 bg-ink-850/95 text-slate-100",
    Icon: Info,
    iconClasses: "text-accent-soft",
  },
};

const DISMISS_MS = 4000;

// Lives inside AppShell's #toast-area. Polite live region, auto-dismiss, manual close.
export default function ToastHost() {
  const [items, setItems] = useState([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    return toast.subscribe((event) => {
      if (event.type === "push") {
        setItems((prev) => [...prev.slice(-3), event.toast]);
        window.setTimeout(() => toast.dismiss(event.toast.id), DISMISS_MS);
      } else if (event.type === "dismiss") {
        setItems((prev) => prev.filter((t) => t.id !== event.id));
      }
    });
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const tone = TONES[t.tone] ?? TONES.info;
          const { Icon } = tone;
          return (
            <motion.div
              key={t.id}
              layout
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              role={t.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-sm shadow-card backdrop-blur ${tone.classes}`}
            >
              <Icon size={17} aria-hidden className={`mt-0.5 shrink-0 ${tone.iconClasses}`} />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-xs opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X size={14} aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
