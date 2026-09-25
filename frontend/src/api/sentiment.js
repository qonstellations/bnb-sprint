import { api } from "./client.js";

export const sentimentApi = {
  get: (symbol) => api.get(`/sentiment/${symbol}`).then((r) => r.data),
  history: (symbol, params) =>
    api.get(`/sentiment/${symbol}/history`, { params }).then((r) => r.data),
};
