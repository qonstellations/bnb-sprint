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
