# StockPulse — Frontend Checklist

Goal: `Login → Search → Stock (price + sentiment + news) → Paper trade → Portfolio/P&L → Alert`. Paper trading only, no recommendations.

Stack (locked): Vite + React + JS, Tailwind only, React Router 6, TanStack Query + Axios, Recharts, Socket.IO (real URL only). JWT in `localStorage` (`stockpulse_token`) as `Bearer`. Contract: `frontend/API.md`. No invented endpoints.

Env: `VITE_API_BASE_URL` (ends with `/api/v1`), `VITE_SOCKET_URL`, `VITE_USE_MOCKS=true` to run MSW mocks.

## Shared (both devs)

- [ ] Use `src/api/client.js` (Bearer + 401 logout) — never hand-roll fetch
- [ ] Use `queryKeys` in `src/lib/queryClient.js` for all Query keys
- [ ] Format via `src/lib/format.js`; errors via `normalizeApiError`
- [ ] States on every section: `Skeleton` / `EmptyState` / `ErrorState` (with Retry)
- [ ] Reuse `src/components/ui.jsx` — no duplicate Button/Input/Card/Modal/Badge
- [ ] Tables scroll on mobile; Trade button always reachable
- [ ] Invalidate after mutations: order → `orders, positions, portfolio-*`; watchlist → `watchlist, quotes`; alerts → `alerts, alert-rules`

## Dev 1 — Trading & Portfolio

- [ ] Auth pages `/login`, `/register` + guards (`RequireAuth`, `RedirectIfAuth`)
- [ ] Shell `AppShell.jsx`: nav Dashboard, Portfolio, Trade→search, Orders, Alerts + logout + `#toast-area`
- [ ] `StockSearch.jsx`: debounced `GET /instruments/search`, empty/error states, → `/stocks/:symbol`
- [ ] Stock header + quote: `GET /instruments/:symbol`, `GET /market/quote/:symbol` (30s poll), ★ watch via `Watchlist.jsx`
- [ ] `PriceChart.jsx`: `GET /market/history/:symbol?interval=1d&range=1m`, tooltip + axes, no indicators
- [ ] `OrderForm.jsx`: BUY/SELL, MARKET/LIMIT, qty + limitPrice (LIMIT only), confirm modal, `POST /orders` + `clientOrderId`, server errors shown
- [ ] `/orders`: `GET /orders`, statuses OPEN/FILLED/CANCELLED (+ backend extras), cancel OPEN only via `POST /orders/:id/cancel` with confirm
- [ ] `/portfolio` + dashboard: `summary, positions, performance?range=1m, allocation`; P&L as `+$x / -$x`
- [ ] Watchlist: `GET/POST/DELETE /watchlist` + bulk `GET /market/quotes?symbols=...` (no per-item spam)

## Dev 2 — Sentiment, News, Alerts

- [ ] `NewsList.jsx`: `GET /news/:symbol` on stock page (+ `GET /news` on `/alerts`), headline/source/time/link/sentiment, missing-meta safe
- [ ] `SentimentScorecard.jsx` + badge: `GET /sentiment/:symbol`, Bullish/Neutral/Bearish only, info not advice
- [ ] `SentimentTimeline.jsx`: `GET /market/history/:symbol` + `GET /sentiment/:symbol/history`, markers with hover (time/sentiment/headline), association only
- [ ] `AlertForm.jsx`: `POST /alerts/rules` — symbol, type (Target/Stop-loss → API `type`), positive `triggerPrice`, validation + server errors
- [ ] `/alerts`: `GET /alerts/rules` (edit via `PATCH`, delete via `DELETE`), `GET /alerts` (triggered), status badges
- [ ] Notifications: Socket `alert:triggered` if live, else poll `GET /alerts`; toast once per transition, no push

## Stock page contract (`/stocks/:symbol`)

- Dev 1 owns shell: header, quote, chart, watch ★, `OrderForm`
- Dev 2 plugs into: `SentimentScorecard`, `SentimentTimeline`, `NewsList`, `AlertForm` (in `src/components/dev2/`)
- Order: header → price/chart + trade → sentiment/alert → timeline → news; mobile stacks in that order

## Demo QA

- [ ] Login → dashboard shows value, cash, P&L, holdings, performance, watchlist
- [ ] Search → open stock → price, chart, sentiment, news visible
- [ ] BUY MARKET → orders, position, P&L, portfolio update; stay in flow
- [ ] Create target/stop-loss → appears under Alerts
- [ ] Desktop + mobile usable; no invented routes; no buy/sell advice

## Out of scope

Real money, payments, RSI/MACD/Bollinger/candles, predictions, recommendations, risk pages, push notifications, options, order types beyond MARKET/LIMIT.
