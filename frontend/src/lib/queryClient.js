import { QueryClient } from "@tanstack/react-query";

// Single shared client per PLAN Sec 25. Features invalidate by key:
// orders, positions, portfolio-*, watchlist, quotes, alerts, instrument, quote, history, news, sentiment.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

// No-arg helpers return the base prefix, so invalidateQueries() without args
// matches every filtered variant (TanStack matches by key prefix when exact is unset).
export const queryKeys = {
  instrument: (symbol) => (symbol ? ["instrument", symbol] : ["instrument"]),
  instrumentSearch: (q) => (q ? ["instrument", "search", q] : ["instrument", "search"]),
  quote: (symbol) => (symbol ? ["quote", symbol] : ["quote"]),
  history: (symbol, params) => ["history", symbol, params],
  quotes: (symbols) => (symbols ? ["quotes", symbols] : ["quotes"]),
  orders: (filters) => (filters ? ["orders", filters] : ["orders"]),
  positions: () => ["positions"],
  portfolioSummary: () => ["portfolio-summary"],
  portfolioPerformance: (range) => (range ? ["portfolio-performance", range] : ["portfolio-performance"]),
  portfolioAllocation: () => ["portfolio-allocation"],
  watchlist: () => ["watchlist"],
  news: (symbol) => ["news", symbol ?? "all"],
  sentiment: (symbol) => (symbol ? ["sentiment", symbol] : ["sentiment"]),
  sentimentHistory: (symbol) => (symbol ? ["sentiment-history", symbol] : ["sentiment-history"]),
  alerts: () => ["alerts"],
  alertRules: () => ["alert-rules"],
};
