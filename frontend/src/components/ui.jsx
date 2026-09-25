export function Button({ className = "", ...props }) {
  return (
    <button
      className={`rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className}`}
      {...props}
    />
  );
}

export function Badge({ tone = "neutral", className = "", ...props }) {
  const tones = {
    neutral: "bg-slate-800 text-slate-200",
    positive: "bg-emerald-900 text-emerald-200",
    negative: "bg-rose-900 text-rose-200",
    info: "bg-indigo-900 text-indigo-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.neutral} ${className}`}
      {...props}
    />
  );
}

export function Skeleton({ className = "", ...props }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800 ${className}`} {...props} />
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-900 bg-rose-950/40 p-6 text-center">
      <p className="text-sm text-rose-200">{message ?? "Something went wrong."}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-rose-800 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-900"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
