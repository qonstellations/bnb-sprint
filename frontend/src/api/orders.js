import { api } from "./client.js";

// Order enums follow API.md (authoritative): side BUY/SELL, type MARKET/LIMIT,
// status OPEN (cancellable limit) / FILLED / CANCELLED. Body: { symbol, side, type, quantity, limitPrice?, clientOrderId? }
export const ordersApi = {
  create: (body) => api.post("/orders", body).then((r) => r.data),
  list: (params) => api.get("/orders", { params }).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  cancel: (id) => api.post(`/orders/${id}/cancel`).then((r) => r.data),
};
