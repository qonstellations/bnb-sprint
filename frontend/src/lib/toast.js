// Minimal toast bus for Dev2 alert notifications.
// Renders into #toast-area (see AppShell). Toast once per key, no push.
const seen = new Set();

export function pushToast(message, key) {
  if (key) {
    if (seen.has(key)) return;
    seen.add(key);
  }
  const area = document.getElementById("toast-area");
  if (!area) return;
  const el = document.createElement("div");
  el.className =
    "mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-800 bg-amber-950/80 px-4 py-2.5 text-sm text-amber-100 shadow-lg";
  el.setAttribute("role", "status");

  const text = document.createElement("span");
  text.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "✕";
  close.setAttribute("aria-label", "Dismiss");
  close.className = "rounded px-2 py-1 text-xs text-amber-300 hover:bg-amber-900";
  close.onclick = () => el.remove();

  el.appendChild(text);
  el.appendChild(close);
  area.appendChild(el);
  window.setTimeout(() => el.remove(), 8000);
}
