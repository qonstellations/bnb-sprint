// Minimal toast bus (no deps). ToastHost subscribes; callers use toast.success/error/info.
// Dedupes identical messages within 1.5s so socket refires / strict-mode double effects
// don't spam. Toast-once-per-transition callers should key by entity id (see toast.once).
let listeners = new Set();
let seq = 0;
let lastPush = { message: "", at: 0 };
const onceSeen = new Map();

function emit(entry) {
  for (const fn of listeners) fn(entry);
}

function push(tone, message) {
  if (!message) return null;
  const now = Date.now();
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
  clear: () => emit({ type: "clear" }),
  // Toast once per key transition (e.g. alert rule id + status). Returns id or null.
  once: (key, tone, message) => {
    if (onceSeen.get(key) === message) return null;
    onceSeen.set(key, message);
    return push(tone, message);
  },
  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
