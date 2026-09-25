import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  AlertTriangle,
  Inbox,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

const BUTTON_VARIANTS = {
  primary:
    "bg-indigo-500 text-white shadow-glow hover:bg-indigo-400",
  secondary:
    "bg-ink-800 text-slate-100 ring-1 ring-white/10 hover:bg-ink-700",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
  ghost:
    "border border-white/10 text-slate-200 hover:border-white/20 hover:bg-white/5",
  link: "px-2 py-1 text-xs text-accent-soft underline-offset-4 hover:underline",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}) {
  return (
    <motion.button
      whileTap={props.disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 font-sans text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
      {children}
    </motion.button>
  );
}

export function Input({ label, error, helper, className = "", id, ...props }) {
  const inputId = id ?? props.name ?? undefined;
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
        }
        className={`w-full rounded-xl border bg-ink-900 px-3.5 py-2.5 font-sans text-sm text-slate-100 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-colors placeholder:text-slate-500 focus:outline-none ${
          error
            ? "border-rose-500/60 focus:border-rose-400"
            : "border-white/10 focus:border-accent/70"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      ) : helper ? (
        <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`card-line rounded-2xl bg-ink-900 p-5 shadow-card ${className}`}
      {...props}
    />
  );
}

export function Badge({ tone = "neutral", dot = false, className = "", ...props }) {
  const tones = {
    neutral: "bg-white/5 text-slate-300 ring-1 ring-white/10",
    positive: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25",
    negative: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/25",
    info: "bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/25",
  };
  const dots = {
    neutral: "bg-slate-400",
    positive: "bg-emerald-400",
    negative: "bg-rose-400",
    info: "bg-indigo-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold ${tones[tone] ?? tones.neutral} ${className}`}
      {...props}
    >
      {dot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${dots[tone] ?? dots.neutral}`} aria-hidden />
      ) : null}
    </span>
  );
}

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      aria-busy="true"
      className={`animate-shimmer rounded-xl bg-gradient-to-r from-ink-800 via-ink-700 to-ink-800 bg-[length:800px_100%] ${className}`}
      {...props}
    />
  );
}

export function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 ring-1 ring-white/10">
        <Icon size={18} aria-hidden />
      </div>
      <p className="font-display text-sm font-semibold text-slate-200">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/25">
        <AlertTriangle size={18} aria-hidden />
      </div>
      <p className="text-sm text-rose-200">{message ?? "Something went wrong."}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-rose-500/25 px-4 py-2 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/10 focus-visible:outline-2 focus-visible:outline-rose-400"
        >
          <RotateCcw size={14} aria-hidden /> Retry
        </button>
      ) : null}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    panel?.querySelector("button")?.focus();
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      // Minimal focus trap: keep Tab cycling inside the dialog.
      if (e.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="card-line w-full max-w-md rounded-2xl bg-ink-850 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
