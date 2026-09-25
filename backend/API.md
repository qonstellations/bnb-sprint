# StockPulse Backend — API Reference

> Quick-reference contract for every endpoint. Frontend devs and teammates use this to know **what to send** and **what comes back** — without reading service code.

---

## Base URL

```
/api/v1
```

## Authentication

All routes except `/auth/register` and `/auth/login` require:

```
Authorization: Bearer <jwt_token>
```

---

## Auth

### `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "user": { "_id": "...", "email": "user@example.com", "createdAt": "..." },
  "token": "jwt_token_here"
}
```

### `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": { "_id": "...", "email": "user@example.com" },
  "token": "jwt_token_here"
}
```

### `GET /auth/me`

**Response (200):**
```json
{
  "user": { "_id": "...", "email": "user@example.com", "createdAt": "..." }
}
```

---

## Instruments

### `GET /instruments/search?q=apple`

**Response (200):**
```json
[
  { "symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "sector": "Technology" }
]
```

### `GET /instruments/:symbol`

**Response (200):**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "exchange": "NASDAQ",
  "currency": "USD",
  "sector": "Technology"
}
```

---

## Market Data

### `GET /market/quote/:symbol`

**Response (200):**
```json
{
  "symbol": "AAPL",
  "currentPrice": 5500,
  "change": 120,
  "changePercent": 2.23,
  "timestamp": "2026-09-25T10:30:00Z"
}
```

### `GET /market/history/:symbol?interval=1d&range=1m`

**Query params:** `interval` (1m, 5m, 15m, 1h, 1d), `range` (1d, 5d, 1m, 3m, 6m, 1y)

**Response (200):**
```json
[
  { "timestamp": "...", "open": 5400, "high": 5550, "low": 5380, "close": 5500, "volume": 12000 }
]
```

### `GET /market/quotes?symbols=AAPL,TSLA,NVDA`

**Response (200):**
```json
[
  { "symbol": "AAPL", "currentPrice": 5500, "change": 120, "changePercent": 2.23 },
  { "symbol": "TSLA", "currentPrice": 2800, "change": -50, "changePercent": -1.75 }
]
```

---

## Orders

### `POST /orders`

**Request:**
```json
{
  "symbol": "AAPL",
  "side": "BUY",
  "type": "MARKET",
  "quantity": 10,
  "limitPrice": null,
  "clientOrderId": "order_928373"
}
```

- `type`: `"MARKET"` or `"LIMIT"`
- `limitPrice`: required when `type` = `"LIMIT"`
- `clientOrderId`: optional, prevents duplicate orders on retry

**Response (201):**
```json
{
  "order": {
    "_id": "...",
    "symbol": "AAPL",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 10,
    "status": "FILLED",
    "filledQuantity": 10,
    "averageFillPrice": 5500,
    "createdAt": "...",
    "executedAt": "..."
  },
  "trade": {
    "_id": "...",
    "orderId": "...",
    "symbol": "AAPL",
    "side": "BUY",
    "quantity": 10,
    "price": 5500,
    "timestamp": "..."
  }
}
```

For LIMIT orders, response returns `status: "OPEN"` with no trade until filled.

### `GET /orders?status=OPEN&symbol=AAPL`

**Query params:** `status`, `symbol`, `page`, `limit`

**Response (200):**
```json
{
  "orders": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### `GET /orders/:id`

**Response (200):** Single order object.

### `POST /orders/:id/cancel`

**Response (200):**
```json
{
  "order": { "_id": "...", "status": "CANCELLED", ... }
}
```

Only `OPEN` (limit) orders can be cancelled.

---

## Portfolio

### `GET /portfolio/summary`

```json
{
  "cash": 50000,
  "investedValue": 55000,
  "totalValue": 105000,
  "totalReturn": 5000,
  "returnPercent": 5.0
}
```

### `GET /portfolio/positions`

```json
[
  {
    "symbol": "AAPL",
    "quantity": 10,
    "averageCost": 5000,
    "currentPrice": 5500,
    "marketValue": 55000,
    "unrealizedPnl": 5000,
    "unrealizedPnlPercent": 10.0
  }
]
```

### `GET /portfolio/performance?range=1m`

```json
{
  "startValue": 100000,
  "currentValue": 105000,
  "totalReturn": 5000,
  "returnPercent": 5.0,
  "dailyReturns": [ { "date": "...", "value": 100500, "returnPercent": 0.5 } ]
}
```

### `GET /portfolio/allocation`

```json
[
  { "symbol": "AAPL", "value": 55000, "percent": 42.3 },
  { "symbol": "TSLA", "value": 25000, "percent": 19.2 },
  { "category": "Cash", "value": 50000, "percent": 38.5 }
]
```

### `GET /portfolio/risk`

```json
{
  "volatility": 0.18,
  "maxDrawdown": -0.2083,
  "sharpeRatio": 1.2,
  "concentrationRisk": { "maxExposure": { "symbol": "AAPL", "percent": 42.3 } },
  "stressScenarios": [
    { "scenario": "Market -10%", "estimatedLoss": -8500 },
    { "scenario": "Tech sector -20%", "estimatedLoss": -16000 }
  ]
}
```

### `GET /portfolio/snapshots?range=1w`

```json
[
  { "timestamp": "...", "portfolioValue": 100000, "cash": 100000, "investedValue": 0 },
  { "timestamp": "...", "portfolioValue": 101300, "cash": 50000, "investedValue": 51300 }
]
```

---

## News

### `GET /news?page=1&limit=20`

```json
{
  "articles": [
    {
      "headline": "Apple Reports Record Revenue",
      "source": "Reuters",
      "url": "...",
      "publishedAt": "...",
      "symbols": ["AAPL"],
      "sentiment": { "label": "BULLISH", "score": 0.78, "confidence": 0.91 }
    }
  ],
  "total": 120,
  "page": 1
}
```

### `GET /news/:symbol`

Same shape, filtered to articles mentioning that symbol.

---

## Sentiment

### `GET /sentiment/:symbol`

```json
{
  "symbol": "AAPL",
  "sentiment": { "label": "BULLISH", "score": 0.71 },
  "breakdown": { "bullish": 62, "neutral": 25, "bearish": 13 },
  "articles": 14,
  "priceChange": 3.2
}
```

### `GET /sentiment/:symbol/history?range=7d`

```json
[
  { "timestamp": "...", "label": "BULLISH", "score": 0.71, "articles": 5 },
  { "timestamp": "...", "label": "NEUTRAL", "score": 0.12, "articles": 3 }
]
```

---

## Watchlist

### `GET /watchlist`

```json
[
  { "symbol": "AAPL", "createdAt": "..." },
  { "symbol": "TSLA", "createdAt": "..." }
]
```

### `POST /watchlist`

**Request:** `{ "symbol": "AAPL" }`

**Response (201):** `{ "symbol": "AAPL", "createdAt": "..." }`

### `DELETE /watchlist/:symbol`

**Response (204):** No content.

---

## Alerts

### `POST /alerts/rules`

**Request:**
```json
{
  "symbol": "AAPL",
  "type": "STOP_LOSS",
  "triggerPrice": 500,
  "quantity": 10,
  "action": "EXECUTE"
}
```

**Response (201):**
```json
{
  "rule": { "_id": "...", "symbol": "AAPL", "type": "STOP_LOSS", "triggerPrice": 500, "status": "ACTIVE", ... }
}
```

### `GET /alerts/rules`

```json
[
  { "_id": "...", "symbol": "AAPL", "type": "STOP_LOSS", "triggerPrice": 500, "status": "ACTIVE", ... }
]
```

### `PATCH /alerts/rules/:id`

**Request:** `{ "triggerPrice": 480 }`

**Response (200):** Updated rule.

### `DELETE /alerts/rules/:id`

**Response (204):** No content.

### `GET /alerts`

```json
[
  {
    "ruleId": "...",
    "symbol": "AAPL",
    "message": "Stop loss triggered at ₹499",
    "createdAt": "..."
  }
]
```

### `POST /alerts/:id/read`

Marks an alert event as read.

**Response (200):** `{ "acknowledged": true }`

---

## WebSocket Events

Connect to the Socket.IO server with the JWT token.

### Server → Client Events

| Event              | Payload                                                         |
| ------------------ | --------------------------------------------------------------- |
| `price:update`     | `{ symbol, currentPrice, change, changePercent, timestamp }`    |
| `order:filled`     | `{ order, trade }`                                              |
| `portfolio:update` | `{ cash, totalValue, totalReturn }`                             |
| `alert:triggered`  | `{ rule, event }`                                               |

---

## Error Response Format

All errors follow:

```json
{
  "error": {
    "code": "INSUFFICIENT_CASH",
    "message": "Not enough cash to execute this order.",
    "details": { "required": 50000, "available": 30000 }
  }
}
```

### Standard Error Codes

| Code                  | HTTP Status | When                                |
| --------------------- | ----------- | ----------------------------------- |
| `VALIDATION_ERROR`    | 400         | Invalid request body                |
| `UNAUTHORIZED`        | 401         | Missing or invalid token            |
| `NOT_FOUND`           | 404         | Resource doesn't exist              |
| `INSUFFICIENT_CASH`   | 422         | Not enough cash for the order       |
| `INSUFFICIENT_SHARES` | 422         | Not enough shares to sell           |
| `DUPLICATE_ORDER`     | 409         | clientOrderId already used          |
| `ORDER_NOT_CANCELLABLE` | 422       | Order is not in OPEN status         |
| `RATE_LIMITED`        | 429         | Too many requests                   |
| `INTERNAL_ERROR`      | 500         | Unexpected server error             |
