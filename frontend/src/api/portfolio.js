import { api } from "./client.js";

export const portfolioApi = {
  summary: () => api.get("/portfolio/summary").then((r) => r.data),
  positions: () => api.get("/portfolio/positions").then((r) => r.data),
  performance: (range) =>
    api.get("/portfolio/performance", { params: range ? { range } : {} }).then((r) => r.data),
  allocation: () => api.get("/portfolio/allocation").then((r) => r.data),
  risk: () => api.get("/portfolio/risk").then((r) => r.data),
  snapshots: (range) =>
    api.get("/portfolio/snapshots", { params: range ? { range } : {} }).then((r) => r.data),
};
