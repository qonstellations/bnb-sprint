import { api } from "./client.js";

export const marketApi = {
  quote: (symbol) => api.get(`/market/quote/${symbol}`).then((r) => r.data),
  history: (symbol, params) =>
    api.get(`/market/history/${symbol}`, { params }).then((r) => r.data),
  quotes: (symbols) =>
    api.get("/market/quotes", { params: { symbols: symbols.join(",") } }).then((r) => r.data),
};
