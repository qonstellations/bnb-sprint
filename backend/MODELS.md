# StockPulse Backend — Data Models Reference

> Canonical schema definitions for every MongoDB collection. Use this when implementing Mongoose models.

---

## Conventions

- All documents have `_id` (ObjectId, auto-generated).
- Timestamps: `createdAt` / `updatedAt` via Mongoose `timestamps: true` where noted.
- All monetary values are stored as **numbers** (not strings). Use consistent currency (₹ or $).
- Indexes are listed per model — create them in the Mongoose schema definition.

---

## User

**Collection:** `users`

| Field          | Type     | Required | Notes                    |
| -------------- | -------- | -------- | ------------------------ |
| `email`        | String   | ✓        | unique, lowercase, trimmed |
| `passwordHash` | String   | ✓        | bcrypt hash              |
| `createdAt`    | Date     | auto     | Mongoose timestamps      |
| `updatedAt`    | Date     | auto     | Mongoose timestamps      |

**Indexes:**
- `{ email: 1 }` unique

---

## PaperAccount

**Collection:** `paperaccounts`

| Field          | Type     | Required | Notes                           |
| -------------- | -------- | -------- | ------------------------------- |
| `userId`       | ObjectId | ✓        | ref: User, unique               |
| `startingCash` | Number   | ✓        | initial deposit (e.g. 100000)   |
| `cashBalance`  | Number   | ✓        | current available cash          |
| `createdAt`    | Date     | auto     | Mongoose timestamps             |

**Indexes:**
- `{ userId: 1 }` unique

---

## Instrument

**Collection:** `instruments`

| Field      | Type   | Required | Notes              |
| ---------- | ------ | -------- | ------------------ |
| `symbol`   | String | ✓        | unique, uppercase  |
| `name`     | String | ✓        | company name       |
| `exchange` | String | ✓        | NASDAQ, NSE, etc.  |
| `currency` | String | ✓        | USD, INR           |
| `sector`   | String |          | Technology, Finance, etc. |

**Indexes:**
- `{ symbol: 1 }` unique
- `{ name: "text", symbol: "text" }` for search

---

## Order

**Collection:** `orders`

| Field              | Type     | Required | Notes                                        |
| ------------------ | -------- | -------- | -------------------------------------------- |
| `userId`           | ObjectId | ✓        | ref: User                                    |
| `symbol`           | String   | ✓        |                                              |
| `side`             | String   | ✓        | enum: `BUY`, `SELL`                          |
| `type`             | String   | ✓        | enum: `MARKET`, `LIMIT`                      |
| `quantity`         | Number   | ✓        | must be > 0                                  |
| `limitPrice`       | Number   |          | required when type = LIMIT                   |
| `status`           | String   | ✓        | enum: `PENDING`, `OPEN`, `FILLED`, `CANCELLED`, `REJECTED` |
| `filledQuantity`   | Number   |          | default: 0                                   |
| `averageFillPrice` | Number   |          | set on fill                                  |
| `source`           | String   | ✓        | enum: `USER`, `STOP_LOSS`, `TARGET`          |
| `clientOrderId`    | String   |          | idempotency key, unique per user             |
| `createdAt`        | Date     | auto     |                                              |
| `executedAt`       | Date     |          | set when filled                              |

**Indexes:**
- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, status: 1 }`
- `{ symbol: 1, status: 1 }`
- `{ userId: 1, clientOrderId: 1 }` unique (sparse, for non-null values)

---

## Trade (Fill)

**Collection:** `trades`

| Field       | Type     | Required | Notes            |
| ----------- | -------- | -------- | ---------------- |
| `orderId`   | ObjectId | ✓        | ref: Order       |
| `userId`    | ObjectId | ✓        | ref: User        |
| `symbol`    | String   | ✓        |                  |
| `side`      | String   | ✓        | enum: `BUY`, `SELL` |
| `quantity`  | Number   | ✓        |                  |
| `price`     | Number   | ✓        | execution price  |
| `timestamp` | Date     | ✓        | execution time   |

**Indexes:**
- `{ userId: 1, timestamp: -1 }`
- `{ orderId: 1 }`

---

## Position

**Collection:** `positions`

| Field         | Type     | Required | Notes                            |
| ------------- | -------- | -------- | -------------------------------- |
| `userId`      | ObjectId | ✓        | ref: User                        |
| `symbol`      | String   | ✓        |                                  |
| `quantity`    | Number   | ✓        | current shares held              |
| `averageCost` | Number   | ✓        | weighted average purchase price  |
| `realizedPnl` | Number   | ✓        | cumulative realized P&L, default: 0 |

**Indexes:**
- `{ userId: 1, symbol: 1 }` unique

**Average Cost Calculation:**

```
newAvgCost = (oldQty × oldAvgCost + newQty × newPrice) / (oldQty + newQty)
```

**Realized P&L on SELL:**

```
realizedPnl += (sellPrice - averageCost) × quantitySold
```

---

## Ledger

**Collection:** `ledgers`

| Field          | Type     | Required | Notes                                |
| -------------- | -------- | -------- | ------------------------------------ |
| `userId`       | ObjectId | ✓        | ref: User                            |
| `type`         | String   | ✓        | enum: `BUY`, `SELL`, `DEPOSIT`, `FEE` |
| `amount`       | Number   | ✓        | positive = credit, negative = debit  |
| `balanceAfter` | Number   | ✓        | cash balance after this entry        |
| `referenceId`  | ObjectId |          | ref: Order or Trade                  |
| `timestamp`    | Date     | ✓        |                                      |

**Indexes:**
- `{ userId: 1, timestamp: -1 }`

---

## NewsArticle

**Collection:** `newsarticles`

| Field         | Type     | Required | Notes                        |
| ------------- | -------- | -------- | ---------------------------- |
| `externalId`  | String   | ✓        | from source, for dedup       |
| `headline`    | String   | ✓        |                              |
| `source`      | String   | ✓        | Reuters, Bloomberg, etc.     |
| `url`         | String   | ✓        |                              |
| `publishedAt` | Date     | ✓        |                              |
| `symbols`     | [String] | ✓        | e.g. `["AAPL", "MSFT"]`     |
| `sentiment.label`      | String |  | enum: `BULLISH`, `NEUTRAL`, `BEARISH` |
| `sentiment.score`      | Number |  | -1.0 to +1.0                |
| `sentiment.confidence` | Number |  | 0.0 to 1.0                  |

**Indexes:**
- `{ externalId: 1 }` unique
- `{ symbols: 1, publishedAt: -1 }`

---

## SentimentSnapshot

**Collection:** `sentimentsnapshots`

| Field       | Type     | Required | Notes                                   |
| ----------- | -------- | -------- | --------------------------------------- |
| `symbol`    | String   | ✓        |                                         |
| `timestamp` | Date     | ✓        |                                         |
| `label`     | String   | ✓        | enum: `BULLISH`, `NEUTRAL`, `BEARISH`   |
| `score`     | Number   | ✓        | aggregate sentiment score               |
| `articles`  | Number   | ✓        | number of articles in this window       |

**Indexes:**
- `{ symbol: 1, timestamp: -1 }`

---

## PortfolioSnapshot

**Collection:** `portfoliosnapshots`

| Field            | Type     | Required | Notes                      |
| ---------------- | -------- | -------- | -------------------------- |
| `userId`         | ObjectId | ✓        | ref: User                  |
| `timestamp`      | Date     | ✓        |                            |
| `portfolioValue` | Number   | ✓        | cash + invested value      |
| `cash`           | Number   | ✓        |                            |
| `investedValue`  | Number   | ✓        | sum of position market values |
| `realizedPnl`    | Number   | ✓        |                            |
| `unrealizedPnl`  | Number   | ✓        |                            |

**Indexes:**
- `{ userId: 1, timestamp: -1 }`

---

## AlertRule

**Collection:** `alertrules`

| Field          | Type     | Required | Notes                                     |
| -------------- | -------- | -------- | ----------------------------------------- |
| `userId`       | ObjectId | ✓        | ref: User                                 |
| `symbol`       | String   | ✓        |                                           |
| `type`         | String   | ✓        | enum: `STOP_LOSS`, `TARGET`               |
| `triggerPrice` | Number   | ✓        |                                           |
| `quantity`     | Number   |          | shares to sell on execute                 |
| `action`       | String   | ✓        | enum: `NOTIFY`, `EXECUTE`                 |
| `status`       | String   | ✓        | enum: `ACTIVE`, `TRIGGERED`, `DISABLED`   |
| `triggeredAt`  | Date     |          | set when triggered                        |
| `createdAt`    | Date     | auto     |                                           |

**Indexes:**
- `{ userId: 1, status: 1 }`
- `{ symbol: 1, status: 1 }`

---

## AlertEvent

**Collection:** `alertevents`

| Field       | Type     | Required | Notes             |
| ----------- | -------- | -------- | ----------------- |
| `ruleId`    | ObjectId | ✓        | ref: AlertRule    |
| `userId`    | ObjectId | ✓        | ref: User         |
| `symbol`    | String   | ✓        |                   |
| `message`   | String   | ✓        | human-readable    |
| `read`      | Boolean  |          | default: false    |
| `createdAt` | Date     | auto     |                   |

**Indexes:**
- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, read: 1 }`

---

## Watchlist

**Collection:** `watchlists`

| Field       | Type     | Required | Notes      |
| ----------- | -------- | -------- | ---------- |
| `userId`    | ObjectId | ✓        | ref: User  |
| `symbol`    | String   | ✓        |            |
| `createdAt` | Date     | auto     |            |

**Indexes:**
- `{ userId: 1, symbol: 1 }` unique
