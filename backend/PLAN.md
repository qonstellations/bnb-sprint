# StockPulse Backend — Master Plan

> **Core philosophy:** The backend is a **simulated financial state machine driven by market events**, not a CRUD wrapper around MongoDB. Every feature flows from state changes — not from endpoints.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Five Interacting Systems](#2-the-five-interacting-systems)
3. [Core Problems Being Solved](#3-core-problems-being-solved)
4. [Module Map](#4-module-map)
5. [Project Structure](#5-project-structure)
6. [Database Models](#6-database-models)
7. [Order Flow — The Heart of the System](#7-order-flow--the-heart-of-the-system)
8. [Limit Order Execution](#8-limit-order-execution)
9. [Market Data Engine](#9-market-data-engine)
10. [Real-Time Architecture](#10-real-time-architecture)
11. [Portfolio API](#11-portfolio-api)
12. [Historical Performance & Snapshots](#12-historical-performance--snapshots)
13. [Risk Engine](#13-risk-engine)
14. [News + Sentiment Engine](#14-news--sentiment-engine)
15. [Alerts Engine](#15-alerts-engine)
16. [Watchlist](#16-watchlist)
17. [Complete Route Architecture](#17-complete-route-architecture)
18. [Background Jobs](#18-background-jobs)
19. [Mongoose Indexes](#19-mongoose-indexes)
20. [Authoritative vs Derived Data](#20-authoritative-vs-derived-data)
21. [Layered Architecture Per Module](#21-layered-architecture-per-module)
22. [Key Anti-Patterns to Avoid](#22-key-anti-patterns-to-avoid)
23. [Deployment Considerations](#23-deployment-considerations)
24. [Implementation Stages](#24-implementation-stages)

---

## 1. Architecture Overview

**Modular monolith** — not microservices.

Express + Mongoose + MongoDB + background jobs + WebSocket in a single Node.js process. Clean module boundaries so it could be split later, but no infrastructure overhead for a hackathon.

```
                    ┌─────────────────────┐
                    │   External Markets  │
                    │ prices / news / data│
                    └──────────┬──────────┘
                               │
                     ┌─────────▼─────────┐
                     │ Market Data Engine │
                     └───────┬─────┬─────┘
                             │     │
                 ┌───────────▼─┐ ┌─▼──────────────┐
                 │ Trading     │ │ Sentiment      │
                 │ Engine      │ │ Engine         │
                 └─────┬───────┘ └──────┬────────┘
                       │                │
                ┌──────▼────────────────▼──────┐
                │       Portfolio Engine       │
                │ cash / positions / P&L        │
                └────────────┬──────────────────┘
                             │
             ┌───────────────▼─────────────────┐
             │ Analytics + Risk + Alerts       │
             └─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ REST + WebSocket │
                    └────────┬────────┘
                             │
                         Frontend
```

---

## 2. The Five Interacting Systems

| System              | What It Does                                            |
| ------------------- | ------------------------------------------------------- |
| **Market Data**     | Ingests prices and historical data from external APIs   |
| **Trading**         | Manages orders → execution → fills                      |
| **Sentiment**       | Analyzes news for bullish/neutral/bearish signals       |
| **Portfolio**       | Owns cash, positions, P&L — the single source of truth  |
| **Analytics + Risk**| Computes performance, volatility, drawdown, stress tests|

---

## 3. Core Problems Being Solved

### Problem 1 — Simulating Actual Trading

Not just "subtract money, add stock." The full lifecycle:

```
Order → Validation → Execution → Fill → Cash movement →
Position update → P&L update → Portfolio update → Notification/UI update
```

### Problem 2 — Financial Consistency

All numbers must agree at all times. The **backend is authoritative** — the frontend never computes and sends back derived values.

```
₹100,000 cash → buy 10 AAPL @ ₹5,000
Cash = ₹50,000 | Position = 10 AAPL | Avg cost = ₹5,000
AAPL → ₹5,500
Market value = ₹55,000 | Unrealized P&L = ₹5,000 | Portfolio = ₹105,000
```

### Problem 3 — Limit Orders Need an Execution Mechanism

Compare user orders against incoming market prices:

```
BUY limit:  currentPrice <= limitPrice  → execute
SELL limit: currentPrice >= limitPrice  → execute
```

No NSE/Nasdaq-style order book needed.

### Problem 4 — Sentiment Connected to Price

Store sentiment snapshots over time so the frontend can overlay sentiment and price on the same timeline:

```
10:30  Bullish   → price +1.2%
11:15  Neutral   → price +0.1%
14:00  Bearish   → price -2.3%
```

### Problem 5 — Risk ≠ P&L

A portfolio can be profitable but dangerously concentrated. The risk engine must calculate allocation, concentration, volatility, drawdown, and stress scenarios independently from P&L.

---

## 4. Module Map

| Module        | Responsibility                       |
| ------------- | ------------------------------------ |
| Auth          | Users, authentication, JWT/session   |
| Instruments   | Stocks, symbols, metadata            |
| Market Data   | Prices, historical data, quote cache |
| Trading       | Orders, execution, fills             |
| Portfolio     | Cash, positions, P&L, ledger         |
| News          | Financial articles                   |
| Sentiment     | Bullish / Neutral / Bearish analysis |
| Analytics     | Performance metrics, snapshots       |
| Risk          | Volatility, drawdown, stress testing |
| Alerts        | Stop loss / target rules + events    |
| Watchlist     | User stock watchlists                |
| Realtime      | WebSocket (Socket.IO) updates        |
| Jobs          | Background polling/processing        |

These are **logical modules inside one Express application**, not separate services.

---

## 5. Project Structure

```
src/
├── app.js                                  # Express app setup
├── server.js                               # Server entry point
│
├── config/
│   ├── db.js                               # MongoDB connection
│   ├── env.js                              # Environment variables
│   └── constants.js                        # App-wide constants
│
├── middleware/
│   ├── auth.js                             # JWT authentication
│   ├── errorHandler.js                     # Global error handler
│   ├── validate.js                         # Request validation
│   └── rateLimiter.js                      # Rate limiting
│
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── user.model.js
│   │
│   ├── instruments/
│   │   ├── instrument.routes.js
│   │   ├── instrument.controller.js
│   │   ├── instrument.service.js
│   │   └── instrument.model.js
│   │
│   ├── market/
│   │   ├── market.routes.js
│   │   ├── market.controller.js
│   │   ├── market.service.js
│   │   └── marketData.provider.js          # External API abstraction
│   │
│   ├── trading/
│   │   ├── trading.routes.js
│   │   ├── trading.controller.js
│   │   ├── trading.service.js              # Order lifecycle
│   │   ├── execution.service.js            # Order matching engine
│   │   ├── order.model.js
│   │   └── trade.model.js                  # Trade/Fill record
│   │
│   ├── portfolio/
│   │   ├── portfolio.routes.js
│   │   ├── portfolio.controller.js
│   │   ├── portfolio.service.js            # Accounting + P&L math
│   │   ├── position.model.js
│   │   ├── account.model.js                # PaperAccount
│   │   └── ledger.model.js                 # Audit trail
│   │
│   ├── news/
│   │   ├── news.routes.js
│   │   ├── news.service.js
│   │   └── news.model.js
│   │
│   ├── sentiment/
│   │   ├── sentiment.routes.js
│   │   ├── sentiment.service.js
│   │   ├── sentiment.provider.js           # LLM/FinBERT/rules abstraction
│   │   └── sentiment.model.js
│   │
│   ├── analytics/
│   │   ├── analytics.routes.js
│   │   ├── analytics.service.js
│   │   └── snapshot.model.js               # PortfolioSnapshot
│   │
│   ├── risk/
│   │   ├── risk.routes.js
│   │   └── risk.service.js
│   │
│   ├── alerts/
│   │   ├── alerts.routes.js
│   │   ├── alerts.controller.js
│   │   ├── alerts.service.js
│   │   ├── ruleEvaluator.js
│   │   ├── alertRule.model.js
│   │   └── alertEvent.model.js
│   │
│   └── watchlist/
│       ├── watchlist.routes.js
│       ├── watchlist.service.js
│       └── watchlist.model.js
│
├── jobs/
│   ├── marketData.job.js                   # Price polling + cache + triggers
│   ├── news.job.js                         # Article ingestion
│   ├── sentiment.job.js                    # Sentiment classification
│   ├── orderMatching.job.js                # Limit order evaluation
│   ├── alert.job.js                        # Alert rule evaluation
│   └── snapshot.job.js                     # Portfolio snapshot capture
│
├── realtime/
│   └── socket.js                           # Socket.IO setup
│
└── utils/
    ├── logger.js
    ├── calculations.js                     # Financial math helpers
    └── errors.js                           # Custom error classes
```

### Why Domain-Based?

Because services can call each other directly:

```
trading.service → portfolio.service → position.model
```

without routing through HTTP or controllers. Controllers stay thin:

```
request → validate → call service → return response
```

Business logic lives in **services**.

---

## 6. Database Models

### User

```js
{
  _id,
  email,
  passwordHash,
  createdAt
}
```

### PaperAccount

```js
{
  _id,
  userId,
  startingCash,       // e.g. 100000
  cashBalance,        // e.g. 73500
  createdAt
}
```

### Instrument

```js
{
  symbol: "AAPL",
  name: "Apple Inc.",
  exchange: "NASDAQ",
  currency: "USD",
  sector: "Technology"
}
```

### Order

The most important model.

```js
{
  _id,
  userId,
  symbol,
  side: "BUY" | "SELL",
  type: "MARKET" | "LIMIT",
  quantity,
  limitPrice,
  status: "PENDING" | "OPEN" | "FILLED" | "CANCELLED" | "REJECTED",
  filledQuantity,
  averageFillPrice,
  source: "USER" | "STOP_LOSS" | "TARGET",
  clientOrderId,       // idempotency — unique per user, prevents duplicate orders on retry
  createdAt,
  executedAt
}
```

### Trade / Fill

An order is an instruction. A trade is what **actually happened**. This separation keeps accounting clean.

```js
{
  _id,
  orderId,
  userId,
  symbol,
  side,
  quantity,
  price,
  timestamp
}
```

### Position

```js
{
  userId,
  symbol,
  quantity,
  averageCost,
  realizedPnl
}
```

**Average cost math:**

- Buy 10 @ ₹100, then 10 @ ₹120 → `(10×100 + 10×120) / 20 = ₹110`
- Sell 5 → `quantity = 15`, `averageCost` stays `₹110`
- Realized P&L = `(sellPrice - averageCost) × quantitySold`

### Ledger

Optional but dramatically helps debugging.

```js
{
  userId,
  type: "BUY" | "SELL" | "DEPOSIT" | "FEE",
  amount,
  balanceAfter,
  referenceId,         // links to orderId or tradeId
  timestamp
}
```

> Answers: "Why does this user have ₹73,420?" without staring at a mutated cashBalance.

### NewsArticle

```js
{
  externalId,          // for deduplication
  headline,
  source,
  url,
  publishedAt,
  symbols: ["AAPL"],
  sentiment: {
    label: "BULLISH",
    score: 0.78,
    confidence: 0.91
  }
}
```

### AlertRule

```js
{
  userId,
  symbol,
  type: "STOP_LOSS" | "TARGET",
  triggerPrice,
  quantity,
  action: "NOTIFY" | "EXECUTE",
  status: "ACTIVE" | "TRIGGERED" | "DISABLED",
  triggeredAt
}
```

### AlertEvent

```js
{
  ruleId,
  userId,
  symbol,
  message,
  createdAt
}
```

### Watchlist

```js
{
  userId,
  symbol,
  createdAt
}
// compound unique index: { userId, symbol }
```

### PortfolioSnapshot

```js
{
  userId,
  timestamp,
  portfolioValue,
  cash,
  investedValue,
  realizedPnl,
  unrealizedPnl
}
```

---

## 7. Order Flow — The Heart of the System

### Market BUY — Complete Flow

```
Frontend: POST /api/v1/orders
{ "symbol": "AAPL", "side": "BUY", "type": "MARKET", "quantity": 10 }

Backend:
  authenticate user
  → validate request
  → verify instrument exists
  → get latest market price
  → check cash sufficiency
  → create order (status: PENDING)
  → execute order
  → create trade/fill
  → update cash (debit)
  → update position (add quantity, recalculate averageCost)
  → update realized/unrealized P&L basis
  → write ledger entry
  → emit WebSocket event
  → return order + fill
```

### Transaction Atomicity

All of the following **must happen in a single Mongoose session/transaction**:

```
Order creation + Trade creation + Cash update + Position update + Ledger update
```

Without this, concurrent requests can produce:

```
cash = ₹5,000
Request A sees ₹5,000
Request B sees ₹5,000
Both buy ₹4,000
Result: cash = -₹3,000  ← BROKEN
```

---

## 8. Limit Order Execution

### Placement

```
BUY AAPL, quantity=10, limitPrice=₹500
Current price: ₹540
→ order status = OPEN (nothing changes in portfolio)
```

### Trigger (via market data job)

```
AAPL price becomes ₹496

BUY limit:  currentPrice <= limitPrice  → execute
SELL limit: currentPrice >= limitPrice  → execute
```

### State Transition

```
OPEN → FILLED → Trade created → Portfolio updated
```

---

## 9. Market Data Engine

### Two Distinct Data Types

| Type       | Shape                                          |
| ---------- | ---------------------------------------------- |
| Current    | `{ symbol, currentPrice, timestamp, change, changePercent }` |
| Historical | `{ timestamp, open, high, low, close, volume }`             |

### Architecture

```
External provider → Market Data Job → Normalize → Cache current prices
                                                 → Store historical data
                                                 → Trading / Alerts / Analytics consume
```

Everything uses one internal price representation:

```js
marketDataService.getQuote("AAPL")
```

The trading engine **does not know** which external API is used. `marketData.provider.js` is the abstraction — swap providers without rewriting trading logic.

---

## 10. Real-Time Architecture

**REST** for:
- Initial page load, historical data, orders, portfolio, watchlist, news

**WebSocket (Socket.IO)** for:
- Price updates, order execution, P&L updates, alerts, portfolio changes

### Event Flow

```
Market Data Job
  → AAPL changes to ₹510
  → Execution Engine checks limit orders
  → Alert Engine checks stop-loss rules
  → Portfolio recalculated
  → Socket.IO emits:
      price:update
      order:filled
      portfolio:update
      alert:triggered
```

> Polling (`GET /quote` in a loop) is NOT a real-time architecture.

---

## 11. Portfolio API

```
GET /api/v1/portfolio/summary     → { cash, investedValue, totalValue, totalReturn, returnPercent }
GET /api/v1/portfolio/positions   → [{ symbol, quantity, averageCost, currentPrice, marketValue, unrealizedPnl, unrealizedPnlPercent }]
GET /api/v1/portfolio/performance → historical performance data
GET /api/v1/portfolio/allocation  → asset allocation breakdown
GET /api/v1/portfolio/risk        → risk metrics
GET /api/v1/portfolio/snapshots   → time-series portfolio values
```

**Key rule:** `currentPrice` comes from market data at read time. It is **never stored as permanent truth** in the position document.

---

## 12. Historical Performance & Snapshots

Periodic snapshots (every 5/15/60 minutes):

```js
{ userId, timestamp, portfolioValue, cash, investedValue, realizedPnl, unrealizedPnl }
```

```
10:00 → ₹100,000
11:00 → ₹101,300
12:00 → ₹99,800
13:00 → ₹103,000
```

Without snapshots, portfolio history cannot be reconstructed accurately.

---

## 13. Risk Engine

### Metrics to Calculate

| Metric              | Formula / Approach                                  |
| ------------------- | --------------------------------------------------- |
| **Allocation**      | Each position's market value / total portfolio value |
| **Portfolio Return** | `(currentValue - initialValue) / initialValue`      |
| **Daily Returns**   | `todayValue / yesterdayValue - 1`                    |
| **Volatility**      | Standard deviation of periodic returns               |
| **Max Drawdown**    | `(trough - peak) / peak` over snapshot history       |
| **Stress Testing**  | Apply scenario multipliers to current positions      |

### Stress Scenarios

```
Scenario A: all stocks -5%
Scenario B: all stocks -10%
Scenario C: technology sector -20%
Scenario D: individual stock -30%
```

Label clearly as **simulation**, not prediction.

---

## 14. News + Sentiment Engine

### Async Pipeline (not inline)

```
News Job → fetch articles → deduplicate → identify symbols → sentiment analysis → store
```

Never do: `GET /news → call LLM → wait 8 sec → return`. Sentiment is pre-computed.

### Sentiment Provider Abstraction

```
SentimentService → SentimentProvider → LLM / FinBERT / keyword rules
```

`sentiment.provider.js` abstracts the implementation — swappable without rewriting service logic.

### Aggregation

```
AAPL sentiment today:  Bullish 62% | Neutral 25% | Bearish 13%
sentimentScore: +0.47
```

### API Response

```json
{
  "symbol": "AAPL",
  "sentiment": { "label": "BULLISH", "score": 0.71 },
  "articles": 14,
  "priceChange": 3.2
}
```

Frontend overlays price and sentiment on the same timeline.

---

## 15. Alerts Engine

### Flow

```
Price update → Rule Evaluator → Match found → Alert Event + Notification
                                            → If action=EXECUTE: create SELL market order → Execution Engine
```

Alerts go through the **same execution pipeline** as user orders — they never directly modify positions.

### Trigger Logic

```
STOP_LOSS: currentPrice <= triggerPrice  → trigger
TARGET:    currentPrice >= triggerPrice  → trigger
```

---

## 16. Watchlist

Simple compound-unique index `{ userId, symbol }` prevents duplicates.

```
GET    /api/v1/watchlist          → list user's watchlist
POST   /api/v1/watchlist          → add symbol
DELETE /api/v1/watchlist/:symbol  → remove symbol
```

---

## 17. Complete Route Architecture

```
/api/v1
│
├── /auth
│   ├── POST   /register
│   ├── POST   /login
│   └── GET    /me
│
├── /instruments
│   ├── GET    /search
│   └── GET    /:symbol
│
├── /market
│   ├── GET    /quote/:symbol
│   ├── GET    /history/:symbol
│   └── GET    /quotes
│
├── /orders
│   ├── POST   /
│   ├── GET    /
│   ├── GET    /:id
│   └── POST   /:id/cancel
│
├── /portfolio
│   ├── GET    /summary
│   ├── GET    /positions
│   ├── GET    /performance
│   ├── GET    /allocation
│   ├── GET    /risk
│   └── GET    /snapshots
│
├── /news
│   ├── GET    /
│   └── GET    /:symbol
│
├── /sentiment
│   ├── GET    /:symbol
│   └── GET    /:symbol/history
│
├── /watchlist
│   ├── GET    /
│   ├── POST   /
│   └── DELETE /:symbol
│
└── /alerts
    ├── GET    /
    ├── POST   /rules
    ├── GET    /rules
    ├── PATCH  /rules/:id
    └── DELETE /rules/:id
```

**What is intentionally NOT here:**

```
POST /portfolio/update
POST /position/update
POST /cash/update
```

The portfolio changes **because of trades** — never via direct client mutation.

---

## 18. Background Jobs

| Job             | Frequency          | What It Does                                                       |
| --------------- | ------------------ | ------------------------------------------------------------------ |
| `marketData`    | Every N seconds    | Fetch prices → normalize → cache → emit websocket → check orders/alerts |
| `news`          | Every few minutes  | Fetch articles → deduplicate → store                               |
| `sentiment`     | On new article     | Sentiment analysis → store classification                          |
| `orderMatching` | On price update    | Evaluate open limit orders against current prices                  |
| `alert`         | On price update    | Check alert rules against price updates                            |
| `snapshot`      | Every 5/15/60 min  | Calculate portfolio value → store snapshot                         |

Background jobs call **services directly** — they never make HTTP requests to their own API.

---

## 19. Mongoose Indexes

| Collection          | Indexes                                   |
| ------------------- | ----------------------------------------- |
| **Orders**          | `{ userId, createdAt }`, `{ userId, status }`, `{ symbol, status }` |
| **Positions**       | `{ userId, symbol }` UNIQUE               |
| **Watchlist**       | `{ userId, symbol }` UNIQUE               |
| **NewsArticles**    | `{ externalId }` UNIQUE, `{ symbol, publishedAt }` |
| **PortfolioSnapshots** | `{ userId, timestamp }`                |
| **AlertRules**      | `{ userId, status }`, `{ symbol, status }`|

---

## 20. Authoritative vs Derived Data

### Authoritative (stored, mutated only through defined operations)

```
cash balance, orders, trades, positions, ledger, alert rules
```

### Derived (computed at read time or via snapshots)

```
portfolio value, unrealized P&L, asset allocation,
volatility, drawdown, sentiment aggregates, chart data
```

Example: `marketValue = quantity × currentPrice` — don't store it permanently because it goes stale the moment price changes.

---

## 21. Layered Architecture Per Module

Every major domain follows:

```
Route → Controller → Service → Model / Provider
```

Example for a trade:

```
POST /orders
  → trading.controller.js
    → trading.service.js
      → execution.service.js
        → marketData.service.js
          → Order + Trade + Position + Account models
```

---

## 22. Key Anti-Patterns to Avoid

| Don't                                              | Do Instead                                              |
| -------------------------------------------------- | ------------------------------------------------------- |
| Route → Model → `save()` for everything            | Route → Controller → Service → Model with business logic |
| Frontend calculates and sends derived values        | Backend is authoritative; frontend reads                 |
| Inline LLM calls in request handlers               | Async jobs + pre-computed sentiment                      |
| Background jobs calling HTTP to own API             | Jobs call services directly                              |
| `POST /portfolio/update` as a public endpoint       | Portfolio changes only via trade execution                |
| Microservices / Kafka / Kubernetes                  | Modular monolith in a single Node process                |
| Polling for real-time data                          | WebSocket for live updates, REST for initial load         |

---

## 23. Deployment Considerations

The application needs long-running processes for:
- Background polling (market data, news)
- Limit order evaluation
- Stop-loss evaluation
- Persistent WebSocket connections

Therefore: **long-running Node process**, not purely serverless.

### Hackathon Architecture

```
Node/Express server + MongoDB
```

### Production-Ready (if scaled later)

```
Node API + Node worker + MongoDB + Redis
```

---

## 24. Implementation Stages

Build in this order — later systems depend on earlier ones.

### Stage 1 — Trading Core

- User, PaperAccount, Instrument models
- Order, Trade, Position models
- Market BUY / SELL / LIMIT BUY / LIMIT SELL
- Order history, active positions, P&L
- Ledger
- **Don't touch sentiment yet.**

### Stage 2 — Market Data

- MarketDataProvider + MarketDataService
- Quote cache
- Historical data storage
- Connect execution engine to live prices
- **Result:** limit orders actually fill against real prices.

### Stage 3 — Real-Time

- Socket.IO integration
- Broadcast: `price:update`, `order:update`, `portfolio:update`
- **Result:** UI stops feeling like a CRUD app.

### Stage 4 — Alerts

- AlertRule + RuleEvaluator + AlertEvent
- Connect to price updates
- **Result:** `price → rule → order/notification` works end-to-end.

### Stage 5 — News + Sentiment

- News ingestion + deduplication
- Sentiment provider + analysis
- Sentiment history
- **Result:** price + sentiment on the same timeline.

### Stage 6 — Analytics + Risk

- Portfolio snapshots
- Allocation, returns, volatility, drawdown
- Stress testing scenarios
- **Result:** the dashboard becomes the presentation layer for an already-working backend.

---

## Key Event Flow Diagram

This is the single most important diagram for the entire backend:

```
                 MARKET PRICE UPDATE
                         │
                         ▼
                 Market Data Engine
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
     Limit Orders      Alerts       WebSocket
           │             │             │
           ▼             ▼             ▼
      Execution      Rule Trigger    Frontend
           │
           ▼
        Trade
           │
           ▼
   ┌───────┴─────────┐
   │                 │
   ▼                 ▼
Cash Account      Position
   │                 │
   └────────┬────────┘
            ▼
      Portfolio Engine
            │
      ┌─────┼─────┐
      ▼     ▼     ▼
     P&L   Risk  Snapshot
                   │
                   ▼
              Analytics API
```

---

## The Question to Settle Before Writing Code

> **What is the exact state transition when a price tick arrives — especially when the same tick simultaneously triggers a limit order, stop-loss, portfolio change, and WebSocket update?**

Answer that, and the entire backend falls into place.
