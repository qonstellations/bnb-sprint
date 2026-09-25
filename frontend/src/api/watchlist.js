import { api } from "./client.js";

export const watchlistApi = {
  list: () => api.get("/watchlist").then((r) => r.data),
  add: (symbol) => api.post("/watchlist", { symbol }).then((r) => r.data),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`).then((r) => r.data),
};
