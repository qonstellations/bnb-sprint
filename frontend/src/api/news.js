import { api } from "./client.js";

export const newsApi = {
  list: (params) => api.get("/news", { params }).then((r) => r.data),
  bySymbol: (symbol, params) => api.get(`/news/${symbol}`, { params }).then((r) => r.data),
};
