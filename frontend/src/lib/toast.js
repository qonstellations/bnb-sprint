// Minimal toast bus (no deps). ToastHost subscribes; callers use toast.success/error/info.
let listeners = new Set();
let seq = 0;
let lastPush = { message: "", at: 0 };

function emit(entry) {
  for (const fn of listeners) fn(entry);
}

function push(tone, message) {
  if (!message) return null;
  const now = Date.now();
  // StrictMode double-invokes effects and sockets refire; collapse identical bursts.
  if (lastPush.message === message && now - lastPush.at < 1500) return null;
  lastPush = { message, at: now };
  const entry = { id: ++seq, tone, message, createdAt: now };
  emit({ type: "push", toast: entry });
  return entry.id;
}

export const toast = {
  success: (message) => push("success", message),
  error: (message) => push("error", message),
  info: (message) => push("info", message),
  dismiss: (id) => emit({ type: "dismiss", id }),
  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// Alert notifications (Dev2 path: socket alert:triggered + Alerts.jsx polling fallback).
// Toast once per key via the same bus so ToastHost is the single renderer.
const seen = new Set();

export function pushToast(message, key) {
  if (key) {
    if (seen.has(key)) return null;
    seen.add(key);
  }
  return toast.info(message);
}
