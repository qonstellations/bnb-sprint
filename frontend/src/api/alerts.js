import { api } from "./client.js";

// Alert rule types follow API.md: e.g. STOP_LOSS (+ target types per PLAN). Status ACTIVE etc.
export const alertsApi = {
  events: () => api.get("/alerts").then((r) => r.data),
  rules: () => api.get("/alerts/rules").then((r) => r.data),
  createRule: (body) => api.post("/alerts/rules", body).then((r) => r.data),
  updateRule: (id, body) => api.patch(`/alerts/rules/${id}`, body).then((r) => r.data),
  deleteRule: (id) => api.delete(`/alerts/rules/${id}`).then((r) => r.data),
  markRead: (id) => api.post(`/alerts/${id}/read`).then((r) => r.data),
};
