import { http, HttpResponse } from "msw";

// Minimal REST stubs matching API.md so both devs can work without a backend.
// Enable with VITE_USE_MOCKS=true. Extend per-feature as needed.
const MOCK_TOKEN = "mock-jwt-token";

// In-memory alert rules + sample news/sentiment so Dev2 flows are demoable.
let ruleSeq = 1;
const mockRules = [
  { _id: "r1", symbol: "AAPL", type: "STOP_LOSS", triggerPrice: 5000, status: "ACTIVE", createdAt: new Date().toISOString() },
];

const mockArticles = [
  {
    headline: "Apple Reports Record Revenue",
    source: "Reuters",
    url: "https://example.com/apple-revenue",
    publishedAt: new Date().toISOString(),
    symbols: ["AAPL"],
    sentiment: { label: "BULLISH", score: 0.78, confidence: 0.91 },
  },
  {
    headline: "Market cools as tech rally pauses",
    source: null,
    url: null,
    publishedAt: new Date(Date.now() - 86_400_000).toISOString(),
    symbols: ["AAPL", "NVDA"],
    sentiment: { label: "NEUTRAL", score: 0.05, confidence: 0.7 },
  },
];

export const handlers = [
  http.post("*/auth/login", async () => {
    return HttpResponse.json({ user: { _id: "u1", email: "demo@stockpulse.dev" }, token: MOCK_TOKEN });
  }),
  http.post("*/auth/register", async () => {
    return HttpResponse.json({ user: { _id: "u1", email: "demo@stockpulse.dev" }, token: MOCK_TOKEN });
  }),
  http.get("*/auth/me", async () => {
    return HttpResponse.json({ user: { _id: "u1", email: "demo@stockpulse.dev" } });
  }),
  http.get("*/instruments/search", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? "";
    const all = [
      { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology" },
      { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", sector: "Automotive" },
      { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", sector: "Technology" },
    ];
    return HttpResponse.json(all.filter((i) => (i.symbol + i.name).toLowerCase().includes(q)));
  }),
  http.get("*/instruments/:symbol", ({ params }) => {
    const { symbol } = params;
    return HttpResponse.json({ symbol, name: `${symbol} Inc.`, exchange: "NASDAQ", currency: "USD", sector: "Technology" });
  }),
  http.get("*/market/quote/:symbol", ({ params }) => {
    const { symbol } = params;
    return HttpResponse.json({ symbol, currentPrice: 5500, change: 120, changePercent: 2.23, timestamp: new Date().toISOString() });
  }),
  http.get("*/market/history/:symbol", () => {
    const now = Date.now();
    return HttpResponse.json(
      Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(now - (29 - i) * 86_400_000).toISOString(),
        open: 5400 + i * 5,
        high: 5450 + i * 5,
        low: 5380 + i * 5,
        close: 5420 + i * 5,
        volume: 12000,
      }))
    );
  }),
  http.get("*/market/quotes", ({ request }) => {
    const symbols = (new URL(request.url).searchParams.get("symbols") ?? "").split(",").filter(Boolean);
    return HttpResponse.json(symbols.map((symbol) => ({ symbol, currentPrice: 5500, change: 120, changePercent: 2.23 })));
  }),
  http.get("*/portfolio/summary", () => {
    return HttpResponse.json({ cash: 50000, investedValue: 55000, totalValue: 105000, totalReturn: 5000, returnPercent: 5.0 });
  }),
  http.get("*/portfolio/positions", () => {
    return HttpResponse.json([
      { symbol: "AAPL", quantity: 10, averageCost: 5000, currentPrice: 5500, marketValue: 55000, unrealizedPnl: 5000, unrealizedPnlPercent: 10.0 },
    ]);
  }),
  http.get("*/portfolio/performance", () => {
    return HttpResponse.json({
      startValue: 100000,
      currentValue: 105000,
      totalReturn: 5000,
      returnPercent: 5.0,
      dailyReturns: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString(),
        value: 100000 + i * 170,
        returnPercent: 0.17,
      })),
    });
  }),
  http.get("*/portfolio/allocation", () => {
    return HttpResponse.json([
      { symbol: "AAPL", value: 55000, percent: 52.4 },
      { category: "Cash", value: 50000, percent: 47.6 },
    ]);
  }),
  http.get("*/watchlist", () => {
    return HttpResponse.json([{ symbol: "AAPL", createdAt: new Date().toISOString() }]);
  }),
  http.post("*/watchlist", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ symbol: body.symbol, createdAt: new Date().toISOString() }, { status: 201 });
  }),
  http.delete("*/watchlist/:symbol", () => {
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/orders", () => {
    return HttpResponse.json({ orders: [], total: 0, page: 1, limit: 20 });
  }),
  http.post("*/orders", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { order: { _id: "o1", ...body, status: body.type === "LIMIT" ? "OPEN" : "FILLED", createdAt: new Date().toISOString() } },
      { status: 201 }
    );
  }),
  http.post("*/orders/:id/cancel", ({ params }) => {
    return HttpResponse.json({ order: { _id: params.id, status: "CANCELLED" } });
  }),
  http.get("*/alerts/rules", () => HttpResponse.json(mockRules)),
  http.post("*/alerts/rules", async ({ request }) => {
    const body = await request.json();
    const rule = {
      _id: `r${++ruleSeq}`,
      symbol: String(body.symbol ?? "").toUpperCase(),
      type: body.type ?? "STOP_LOSS",
      triggerPrice: Number(body.triggerPrice ?? 0),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    mockRules.push(rule);
    return HttpResponse.json({ rule }, { status: 201 });
  }),
  http.patch("*/alerts/rules/:id", async ({ params, request }) => {
    const body = await request.json();
    const rule = mockRules.find((r) => r._id === params.id);
    if (!rule) return HttpResponse.json({ error: { code: "NOT_FOUND", message: "Rule not found." } }, { status: 404 });
    if (body.triggerPrice != null) rule.triggerPrice = Number(body.triggerPrice);
    return HttpResponse.json(rule);
  }),
  http.delete("*/alerts/rules/:id", ({ params }) => {
    const i = mockRules.findIndex((r) => r._id === params.id);
    if (i >= 0) mockRules.splice(i, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/alerts", () => HttpResponse.json([])),
  http.post("*/alerts/:id/read", () => HttpResponse.json({ acknowledged: true })),
  http.get("*/news", () => HttpResponse.json({ articles: mockArticles, total: mockArticles.length, page: 1 })),
  http.get("*/news/:symbol", ({ params }) => {
    const sym = String(params.symbol ?? "").toUpperCase();
    const filtered = mockArticles.filter((a) => (a.symbols ?? []).includes(sym));
    return HttpResponse.json({ articles: filtered, total: filtered.length, page: 1 });
  }),
  http.get("*/sentiment/:symbol", ({ params }) => {
    return HttpResponse.json({ symbol: params.symbol, sentiment: { label: "BULLISH", score: 0.71 }, breakdown: { bullish: 62, neutral: 25, bearish: 13 }, articles: 14, priceChange: 3.2 });
  }),
  http.get("*/sentiment/:symbol/history", () => {
    const now = Date.now();
    const labels = ["BULLISH", "NEUTRAL", "BULLISH", "BEARISH", "NEUTRAL", "BULLISH", "NEUTRAL"];
    return HttpResponse.json(
      labels.map((label, i) => ({
        timestamp: new Date(now - (6 - i) * 86_400_000).toISOString(),
        label,
        score: label === "BULLISH" ? 0.7 : label === "BEARISH" ? -0.6 : 0.05,
        articles: 2 + i,
      }))
    );
  }),
];
