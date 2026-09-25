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

export const queryKeys = {
  instrument: (symbol) => ["instrument", symbol],
  quote: (symbol) => ["quote", symbol],
  history: (symbol, params) => ["history", symbol, params],
  quotes: (symbols) => ["quotes", symbols],
  orders: (filters) => ["orders", filters ?? "all"],
  positions: () => ["positions"],
  portfolioSummary: () => ["portfolio-summary"],
  portfolioPerformance: (range) => ["portfolio-performance", range],
  portfolioAllocation: () => ["portfolio-allocation"],
  watchlist: () => ["watchlist"],
  news: (symbol) => ["news", symbol ?? "all"],
  sentiment: (symbol) => ["sentiment", symbol],
  sentimentHistory: (symbol) => ["sentiment-history", symbol],
  alerts: () => ["alerts"],
  alertRules: () => ["alert-rules"],
};
