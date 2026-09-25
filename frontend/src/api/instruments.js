import { api } from "./client.js";

export const instrumentsApi = {
  search: (q) => api.get("/instruments/search", { params: { q } }).then((r) => r.data),
  get: (symbol) => api.get(`/instruments/${symbol}`).then((r) => r.data),
};
