# StockPulse Backend — Event Flows

> This document traces every important state transition in the system. When you're implementing a service, find the relevant flow here to know exactly what should happen and in what order.

---

## 1. Market Order BUY

**Trigger:** `POST /api/v1/orders` with `type: "MARKET"`, `side: "BUY"`

```
User submits order
  │
  ▼
Authenticate (JWT)
  │
  ▼
Validate request body
  │
  ▼
Verify instrument exists (instrument.service)
  │
  ▼
Get latest price (market.service.getQuote)
  │
  ▼
Calculate total cost = quantity × currentPrice
  │
  ▼
Check cashBalance >= totalCost (account.model)
  │  ✗ → reject order (status: REJECTED, reason: INSUFFICIENT_CASH)
  │
  ▼ ✓
─── BEGIN MONGOOSE TRANSACTION ───
  │
  ├─ Create Order (status: FILLED)
  ├─ Create Trade (fill record)
  ├─ Debit cash: cashBalance -= totalCost
  ├─ Upsert Position:
  │    if new: quantity = orderQty, averageCost = price
  │    if exists: recalculate averageCost, add quantity
  ├─ Write Ledger entry (type: BUY, amount: -totalCost, balanceAfter)
  │
─── COMMIT TRANSACTION ───
  │
  ▼
Emit WebSocket events:
  ├─ order:filled
  └─ portfolio:update
  │
  ▼
Return { order, trade } to client
```

---

## 2. Market Order SELL

**Trigger:** `POST /api/v1/orders` with `type: "MARKET"`, `side: "SELL"`

```
Validate request
  │
  ▼
Check position exists && position.quantity >= orderQuantity
  │  ✗ → reject (INSUFFICIENT_SHARES)
  │
  ▼ ✓
Get latest price
  │
  ▼
─── BEGIN TRANSACTION ───
  │
  ├─ Create Order (status: FILLED)
  ├─ Create Trade
  ├─ Credit cash: cashBalance += quantity × price
  ├─ Update Position:
  │    quantity -= soldQuantity
  │    realizedPnl += (sellPrice - averageCost) × soldQuantity
  │    if quantity === 0 → delete position document
  ├─ Write Ledger entry (type: SELL, amount: +proceeds, balanceAfter)
  │
─── COMMIT TRANSACTION ───
  │
  ▼
Emit: order:filled, portfolio:update
```

---

## 3. Limit Order Placement

**Trigger:** `POST /api/v1/orders` with `type: "LIMIT"`

```
Validate request (limitPrice required)
  │
  ▼
Verify instrument exists
  │
  ▼
For BUY: verify cashBalance >= quantity × limitPrice (reserve check)
For SELL: verify position.quantity >= orderQuantity
  │  ✗ → reject
  │
  ▼ ✓
Create Order (status: OPEN)
  │
  ▼
Return order to client (no trade yet)
```

**Note:** Cash is NOT debited yet. The order sits in OPEN status until the market data job triggers execution.

---

## 4. Limit Order Fill (Background)

**Trigger:** Market data job receives a new price tick

```
Market Data Job receives new price for symbol
  │
  ▼
Query all OPEN orders for this symbol
  │
  ▼
For each order:
  │
  ├─ BUY LIMIT:  currentPrice <= limitPrice ?
  ├─ SELL LIMIT: currentPrice >= limitPrice ?
  │
  │  ✗ → skip, order stays OPEN
  │
  ▼ ✓
─── BEGIN TRANSACTION ───
  │
  ├─ Update Order (status: FILLED, executedAt, averageFillPrice)
  ├─ Create Trade
  ├─ Update cash (debit for BUY, credit for SELL)
  ├─ Update position
  ├─ Write Ledger entry
  │
─── COMMIT TRANSACTION ───
  │
  ▼
Emit: order:filled, portfolio:update
```

---

## 5. Order Cancellation

**Trigger:** `POST /api/v1/orders/:id/cancel`

```
Find order by ID
  │
  ▼
Check order.status === "OPEN"
  │  ✗ → error (ORDER_NOT_CANCELLABLE)
  │
  ▼ ✓
Update order.status = "CANCELLED"
  │
  ▼
Emit: order:update
```

---

## 6. Market Price Update (Core Event Loop)

**Trigger:** Market data polling job runs every N seconds

```
Fetch latest prices from external provider
  │
  ▼
Normalize into internal format
  │
  ▼
Update quote cache
  │
  ▼
─── PARALLEL EFFECTS ───
  │
  ├─ [1] Emit price:update via WebSocket (for all subscribed clients)
  │
  ├─ [2] Check OPEN limit orders against new prices
  │       → execute matching orders (Flow #4)
  │
  └─ [3] Check ACTIVE alert rules against new prices
         → trigger matching alerts (Flow #7)
```

---

## 7. Alert Rule Trigger

**Trigger:** Price update matches an active alert rule

```
New price arrives for symbol
  │
  ▼
Query ACTIVE alert rules for this symbol
  │
  ▼
For each rule:
  │
  ├─ STOP_LOSS: currentPrice <= triggerPrice ?
  ├─ TARGET:    currentPrice >= triggerPrice ?
  │
  │  ✗ → skip
  │
  ▼ ✓
Update rule.status = "TRIGGERED", set triggeredAt
  │
  ▼
Create AlertEvent { ruleId, symbol, message }
  │
  ▼
─── BRANCH ON action ───
  │
  ├─ action = "NOTIFY"
  │     → Emit alert:triggered via WebSocket
  │
  └─ action = "EXECUTE"
        → Create SELL market order (source: "STOP_LOSS" or "TARGET")
        → Flow #2 (Market Order SELL) executes
        → Emit alert:triggered + order:filled + portfolio:update
```

---

## 8. News Ingestion

**Trigger:** News polling job runs every few minutes

```
Fetch latest articles from external news API
  │
  ▼
For each article:
  │
  ├─ Check externalId exists in DB
  │    ✓ exists → skip (dedup)
  │
  ▼ ✗ new
  │
  ├─ Identify related symbols from article content
  ├─ Store article (sentiment fields empty initially)
  │
  ▼
Queue for sentiment analysis (Flow #9)
```

---

## 9. Sentiment Analysis

**Trigger:** New article stored, or sentiment job picks up unanalyzed articles

```
Get unanalyzed articles
  │
  ▼
For each article:
  │
  ▼
Send to SentimentProvider.analyze(headline + text)
  │
  ▼
Receive: { label, score, confidence }
  │
  ▼
Update article.sentiment = { label, score, confidence }
  │
  ▼
Periodically aggregate into SentimentSnapshot:
  { symbol, timestamp, label, score, articles }
```

---

## 10. Portfolio Snapshot

**Trigger:** Snapshot job runs every 5/15/60 minutes

```
For each user with positions:
  │
  ▼
Get current cash balance
  │
  ▼
Get all positions
  │
  ▼
For each position:
  │  marketValue = quantity × currentPrice (from quote cache)
  │  unrealizedPnl = (currentPrice - averageCost) × quantity
  │
  ▼
investedValue = sum of all marketValues
portfolioValue = cash + investedValue
totalUnrealizedPnl = sum of all unrealizedPnl
totalRealizedPnl = sum of all position.realizedPnl
  │
  ▼
Store PortfolioSnapshot {
  userId, timestamp, portfolioValue,
  cash, investedValue, realizedPnl, unrealizedPnl
}
```

---

## 11. Portfolio Read (Summary)

**Trigger:** `GET /api/v1/portfolio/summary`

```
Get PaperAccount.cashBalance
  │
  ▼
Get all positions for user
  │
  ▼
For each position:
  │  currentPrice ← market.service.getQuote(symbol)
  │  marketValue = quantity × currentPrice
  │  unrealizedPnl = (currentPrice - averageCost) × quantity
  │
  ▼
investedValue = sum(marketValues)
totalValue = cash + investedValue
totalReturn = totalValue - startingCash
returnPercent = (totalReturn / startingCash) × 100
  │
  ▼
Return { cash, investedValue, totalValue, totalReturn, returnPercent }
```

**Key:** `currentPrice` is fetched live from quote cache. It is **never** stored in the position document.

---

## Summary: What Happens on a Single Price Tick

When the market data engine receives a new price for AAPL:

```
                   AAPL = ₹496
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    Limit Orders   Alert Rules   WebSocket
          │            │            │
    BUY @ ₹500    SL @ ₹500    price:update
    matches!       matches!     → frontend
          │            │
          ▼            ▼
     Fill order   Trigger alert
          │            │
          ▼            ▼
      Trade        action=EXECUTE
          │            │
          ▼            ▼
  Cash debit      Create SELL order
  Position +           │
  Ledger               ▼
          │        Fill SELL order
          ▼            │
  portfolio:update     ▼
  order:filled     Cash credit
                   Position -
                   Ledger
                       │
                       ▼
               portfolio:update
               order:filled
               alert:triggered
```

All of these state changes cascade from **one price tick**. This is why the system must be thought of as a state machine, not as CRUD endpoints.
