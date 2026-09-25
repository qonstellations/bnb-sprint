# StockPulse — Final Frontend PLAN.md

## 1. Purpose

Build the StockPulse frontend as a polished hackathon MVP that demonstrates one complete, convincing user journey:

> **Sign in → Search a stock → View price + sentiment + news → Place a paper trade → Track the position and P&L → Set a target/stop-loss alert**

The frontend should prioritize a small number of polished flows over feature breadth.

StockPulse is a paper-trading and market-insights application. All trading is simulated using virtual money. The frontend must present market information clearly without making investment recommendations.

---

# 2. Backend API Contract

Base API:

```text
/api/v1
```

## Authentication

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

## Instruments

```text
GET /instruments/search
GET /instruments/:symbol
```

## Market Data

```text
GET /market/quote/:symbol
GET /market/history/:symbol
GET /market/quotes
```

## Orders

```text
POST /orders
GET  /orders
GET  /orders/:id
POST /orders/:id/cancel
```

## Portfolio

```text
GET /portfolio/summary
GET /portfolio/positions
GET /portfolio/performance
GET /portfolio/allocation
GET /portfolio/risk
GET /portfolio/snapshots
```

## News

```text
GET /news
GET /news/:symbol
```

## Sentiment

```text
GET /sentiment/:symbol
GET /sentiment/:symbol/history
```

## Watchlist

```text
GET    /watchlist
POST   /watchlist
DELETE /watchlist/:symbol
```

## Alerts

```text
GET    /alerts
POST   /alerts/rules
GET    /alerts/rules
PATCH  /alerts/rules/:id
DELETE /alerts/rules/:id
```

---

# 3. Frontend Technical Direction

Before implementation, inspect the existing repository and preserve its established conventions.

Determine:

- Frontend framework and version.
- Routing system.
- Styling solution.
- Component library, if present.
- State-management solution.
- Data-fetching/query library.
- Charting library.
- Authentication/token handling.
- Existing API client.
- Existing reusable UI components.
- Existing TypeScript models/types.
- Existing error/toast/loading patterns.

## API Layer

Mirror the backend resource boundaries in the frontend.

Recommended structure:

```text
src/
├── api/
│   ├── auth.ts
│   ├── instruments.ts
│   ├── market.ts
│   ├── orders.ts
│   ├── portfolio.ts
│   ├── news.ts
│   ├── sentiment.ts
│   ├── watchlist.ts
│   └── alerts.ts
│
├── components/
├── pages/
├── hooks/
├── types/
├── lib/
└── utils/
```

Use the actual repository structure when one already exists.

Do not create speculative frontend endpoints that are not backed by the backend API.

---

# 4. Developer Ownership

## Developer 1 — Core Trading & Portfolio

Own:

- Authentication
- Application shell/navigation
- Dashboard
- Stock search
- Instrument data
- Market quotes/history
- Order placement
- Order history
- Positions
- Portfolio summary
- Portfolio performance
- Allocation
- Watchlist
- Core stock-detail layout

Backend ownership:

```text
/auth
/instruments
/market
/orders
/portfolio
/watchlist
```

## Developer 2 — News, Sentiment & Alerts

Own:

- News feed
- Stock-specific news
- Current sentiment
- Sentiment history
- Price + sentiment visualization
- Alert creation/editing/deletion
- Alert status
- In-app alert notifications
- Insight-side sections of the stock-detail page

Backend ownership:

```text
/news
/sentiment
/alerts
```

## Shared Ownership

Both developers collaborate on:

- Design system
- Shared layout/components
- API client conventions
- Authentication state
- Shared types
- Stock detail route
- Toast/notification system
- Final responsive polish
- Integration testing

Avoid two implementations of the same reusable component.

---

# 5. MVP Routes / Pages

Keep the application to a small set of meaningful screens.

```text
/login
/register
/dashboard
/stocks/:symbol
/portfolio
/orders
/alerts
```

The watchlist does not require a separate page for MVP. It can live on the dashboard and stock pages.

---

# 6. Global Application Shell

## Requirements

Create a protected application layout containing:

- App logo/name: StockPulse
- Main navigation
- User/account area
- Logout action
- Responsive mobile navigation
- Global toast/notification area

Suggested navigation:

```text
Dashboard
Portfolio
Trade
Orders
Alerts
```

`Trade` should lead to stock search / stock detail rather than a standalone trading screen with no selected stock.

---

# 7. Authentication

## Developer 1

Implement:

### Register

```text
POST /api/v1/auth/register
```

### Login

```text
POST /api/v1/auth/login
```

### Current User

```text
GET /api/v1/auth/me
```

Requirements:

- Form validation.
- Loading state.
- Backend error handling.
- Authenticated route protection.
- Persist auth according to the backend's chosen mechanism.
- Redirect authenticated users to `/dashboard`.
- Redirect unauthenticated users to `/login`.
- Logout should clear client auth state.

Do not invent a token-storage strategy before inspecting the backend authentication contract.

---

# 8. Dashboard

## Developer 1

The dashboard is the user's primary landing page.

Display:

### Summary cards

- Total portfolio value
- Available cash
- Total P&L / return
- Number of positions

Use:

```text
GET /portfolio/summary
```

### Holdings preview

Use:

```text
GET /portfolio/positions
```

Show:

- Symbol
- Current price
- Quantity
- Current value
- P&L
- P&L %

### Performance chart

Use:

```text
GET /portfolio/performance
```

Display a simple historical portfolio-value chart.

Avoid advanced indicators.

### Allocation chart

Use:

```text
GET /portfolio/allocation
```

Display a simple donut/pie chart.

### Watchlist preview

Use:

```text
GET /watchlist
GET /market/quotes
```

Show:

- Symbol
- Company
- Current price
- Daily change

### Optional risk card

`GET /portfolio/risk` may be used for a single compact metric if the response is already demo-friendly.

Do not create a separate risk-analysis page.

---

# 9. Stock Search

## Developer 1

Use:

```text
GET /instruments/search
```

Requirements:

- Search by ticker/company name.
- Debounce requests where appropriate.
- Display symbol + company name.
- Loading state.
- Empty state.
- Error state.
- Selecting a result navigates to:

```text
/stocks/:symbol
```

Create one reusable search component and use it throughout the application.

Suggested component:

```text
StockSearch
```

---

# 10. Stock Detail Page

This is the main collaborative page.

Structure:

```text
┌───────────────────────────────────────────────────┐
│ Stock Header                         [Watchlist ★]│
├───────────────────────────────────────────────────┤
│ Current Price / Daily Change                      │
│                                                   │
│                 PRICE CHART                       │
├───────────────────────────┬───────────────────────┤
│                           │ Sentiment             │
│ Trading Panel             │ Scorecard             │
│ Buy / Sell                │                       │
│ Market / Limit            │                       │
│                           │                       │
├───────────────────────────┴───────────────────────┤
│ Price + Sentiment Timeline                        │
├───────────────────────────────────────────────────┤
│ Related Financial News                            │
├───────────────────────────────────────────────────┤
│ Price Alert / Stop-Loss                           │
└───────────────────────────────────────────────────┘
```

Developer 1 owns:

- Header
- Quote
- Price chart
- Watchlist action
- Trading panel

Developer 2 owns:

- Sentiment scorecard
- Sentiment history/timeline
- News
- Alert controls

Both developers must agree on the shared stock symbol/route/type contract.

---

# 11. Stock Header and Quote

## Developer 1

Instrument:

```text
GET /instruments/:symbol
```

Quote:

```text
GET /market/quote/:symbol
```

Display:

- Company name
- Symbol
- Current price
- Daily change
- Daily percentage change
- Optional exchange/sector/logo only if API provides it
- Watchlist button

Do not fabricate missing metadata.

Use consistent price/currency formatting.

---

# 12. Price History Chart

## Developer 1

Use:

```text
GET /market/history/:symbol
```

Create a simple interactive line/area chart.

Requirements:

- Time range controls only if the API supports them.
- Tooltip.
- Price axis.
- Time axis.
- Responsive resizing.
- Loading state.
- Empty state.
- Error state.

Do not add:

- RSI
- MACD
- Bollinger Bands
- Candlestick-analysis tools
- Buy/sell prediction overlays

The chart exists primarily to explain price movement.

---

# 13. Trading Panel

## Developer 1

Use:

```text
POST /orders
```

The backend is authoritative for balance, execution, position, and final P&L.

The order form supports:

```text
BUY / SELL
MARKET / LIMIT
Quantity
Limit price (only for LIMIT)
```

Display:

- Current price
- Available virtual cash
- Current holding, when applicable
- Estimated order value
- Remaining cash estimate for buys

## Validation

- Quantity must be positive.
- Limit price is required for limit orders.
- Limit price must be valid numeric input.
- Prevent obviously malformed input.
- Show server-side validation errors.

Do not allow limit-price input when `MARKET` is selected.

---

# 14. Order Confirmation

Before submission, show a confirmation dialog containing:

- Buy/Sell
- Symbol
- Order type
- Quantity
- Limit price if applicable
- Estimated order value

Actions:

```text
Confirm
Cancel
```

After successful submission:

1. Show success feedback.
2. Refresh/invalidate orders.
3. Refresh/invalidate positions.
4. Refresh/invalidate portfolio summary.
5. Refresh relevant quote if required.
6. Keep the user in the trading workflow.

---

# 15. Orders Page

## Developer 1

Use:

```text
GET /orders
```

Display:

- Date/time
- Symbol
- Side
- Order type
- Quantity
- Price / limit price
- Status
- Total value when available

Possible statuses:

```text
PENDING
FILLED
CANCELLED
REJECTED
```

Adapt to actual backend enum values.

For cancellable orders, use:

```text
POST /orders/:id/cancel
```

Provide clear confirmation before cancellation.

Handle:

- Loading
- Empty
- Error
- Pagination if already supported by backend

Do not build complex order filters unless they are already easy to support.

---

# 16. Positions / Holdings

## Developer 1

Use:

```text
GET /portfolio/positions
```

Display:

- Symbol
- Company
- Quantity
- Average price
- Current price
- Current value
- P&L
- P&L %

Use reusable table/card layouts.

On mobile, convert the wide table into stacked holding cards if necessary.

---

# 17. Portfolio Page

## Developer 1

Use:

```text
GET /portfolio/summary
GET /portfolio/positions
GET /portfolio/performance
GET /portfolio/allocation
```

The page contains:

```text
Summary
↓
Performance
↓
Allocation
↓
Holdings
```

Keep it simple.

Do not turn `/portfolio/risk` or `/portfolio/snapshots` into separate features.

Only use `/portfolio/snapshots` if the response is necessary to support the performance visualization and `/performance` does not already provide the required data.

---

# 18. Watchlist

## Developer 1

Use:

```text
GET    /watchlist
POST   /watchlist
DELETE /watchlist/:symbol
```

Requirements:

- Add a stock.
- Remove a stock.
- View watchlist.
- Display current quote.
- Clicking a stock opens `/stocks/:symbol`.

Use `/market/quotes` to efficiently populate multiple watchlist prices where the API supports it.

Avoid individual quote requests for every watchlist item when the bulk endpoint can handle them.

---

# 19. News Feed

## Developer 2

Global news:

```text
GET /news
```

Stock-specific news:

```text
GET /news/:symbol
```

For the stock page, prefer the stock-specific endpoint.

Each article should display:

- Headline
- Source
- Published time/date
- Related symbol if available
- Sentiment
- Article link if provided

Suggested components:

```text
NewsList
NewsCard
```

Handle:

- Loading
- No news
- Error
- Long headlines
- Missing metadata

Keep the list compact and readable.

---

# 20. Sentiment

## Developer 2

Current sentiment:

```text
GET /sentiment/:symbol
```

History:

```text
GET /sentiment/:symbol/history
```

User-facing categories:

```text
Bullish
Neutral
Bearish
```

Create:

```text
SentimentBadge
SentimentScorecard
```

The scorecard can show either the backend's score or a distribution if provided.

Example:

```text
Market Sentiment
BULLISH

7 Bullish
3 Neutral
2 Bearish
```

Do not convert sentiment into:

- Buy recommendation
- Sell recommendation
- Price prediction
- Guaranteed outcome

Sentiment should be presented as market information.

---

# 21. Price + Sentiment Visualization

## Developer 2

Use:

```text
GET /market/history/:symbol
GET /sentiment/:symbol/history
```

Create a lightweight visual correlation/timeline experience.

Preferred implementation:

- Price chart as the primary timeline.
- Sentiment/news markers over or beneath it.
- Marker color/label for Bullish, Neutral, Bearish.
- Hover/tap reveals:
  - Time
  - Sentiment
  - Optional headline

Alternative:

```text
Price chart
──────────────
Sentiment timeline
──────────────
News events
```

Use whichever implementation is easiest with the existing charting library.

Important:

The visualization shows temporal association only. It must not imply that a news item caused a specific price movement.

---

# 22. Alerts

## Developer 2

Alert APIs:

```text
GET    /alerts
POST   /alerts/rules
GET    /alerts/rules
PATCH  /alerts/rules/:id
DELETE /alerts/rules/:id
```

MVP alert types:

```text
Target Price
Stop Loss
```

## Create Alert

Required fields:

- Symbol
- Alert type
- Trigger price

Optional fields only if backend requires them.

Create:

```text
AlertForm
AlertModal
```

Validation:

- Valid symbol.
- Valid positive trigger price.
- Clear validation errors.
- Server errors displayed.

---

# 23. Alert List

## Developer 2

Display:

- Symbol
- Current price if available
- Alert type
- Trigger price
- Status
- Created time
- Edit
- Delete / disable

Use:

```text
GET /alerts
```

Determine whether it contains enough information about triggered alerts.

Do not build a separate notification backend unless required.

---

# 24. Alert Trigger Notifications

The backend routes do not specify a dedicated real-time notification stream.

For the hackathon, use a simple refresh strategy.

Preferred:

```text
Poll GET /alerts periodically
```

at a reasonable interval, or use an existing real-time mechanism if one already exists.

When an alert transitions to a triggered state:

- Show an in-app toast/banner.
- Update the alert row.
- Avoid repeatedly showing the same notification.

A simple client-side mechanism can remember recently-notified alert IDs/status transitions during the current session.

Do not implement browser push notifications for MVP.

---

# 25. API Query / Refresh Strategy

Use a consistent server-state strategy.

If the repository uses TanStack Query/React Query, follow it.

### Example invalidation

After successful order:

```text
orders
positions
portfolio-summary
portfolio-performance
portfolio-allocation
```

After watchlist mutation:

```text
watchlist
market quotes
```

After alert mutation:

```text
alerts
alert rules
```

After selecting a stock:

```text
instrument
quote
history
news
sentiment
sentiment history
```

Avoid duplicate API calls when the same data can be shared/cached.

---

# 26. Real-Time Feel

Do not overengineer real-time behavior.

Use:

- Quote polling only where needed.
- Portfolio refresh after trade.
- Alert polling if no socket/event mechanism exists.
- Refetch when returning to an active screen.

Avoid multiple independent timers for the same data.

Show last-updated information when useful.

---

# 27. Shared Component System

Build or reuse shared primitives:

```text
Button
Input
Select
Modal
Card
Table
Tabs
Badge
Toast
Tooltip
Skeleton
EmptyState
ErrorState
```

Product-specific components:

```text
StockSearch
StockHeader
PriceChange
PriceChart
OrderForm
OrderConfirmationModal
HoldingsTable
OrdersTable
PortfolioSummary
PerformanceChart
AllocationChart
Watchlist
NewsCard
NewsList
SentimentBadge
SentimentScorecard
SentimentTimeline
AlertForm
AlertList
AlertStatusBadge
```

Avoid duplicated versions of the same component.

---

# 28. UI Direction

Target a modern fintech/trading visual language.

Characteristics:

- Clean dark or light professional UI depending on the existing project theme.
- Strong information hierarchy.
- Dense but readable data presentation.
- Clear positive/negative P&L treatment.
- Consistent financial formatting.
- Minimal decorative animation.
- Strong chart readability.
- Responsive cards and tables.

Use the existing design system if available.

---

# 29. Responsive Requirements

Desktop should be the primary hackathon presentation target, but the MVP must remain usable on mobile.

### Desktop

Use:

- Two-column layouts where useful.
- Tables for orders/positions.
- Chart + insight panels.

### Mobile

Stack:

```text
Stock Header
Price
Chart
Trade Form
Sentiment
News
Alert
```

Convert wide tables to horizontal scrolling or cards.

Do not let critical action buttons become inaccessible.

---

# 30. Loading / Error / Empty States

Every major data-driven section needs explicit state handling.

## Loading

Use skeletons or compact spinners.

## Empty

Examples:

```text
No positions yet.
No orders yet.
Your watchlist is empty.
No news available.
No sentiment data available.
No alerts configured.
```

## Error

Display:

- Clear human-readable message.
- Retry control where appropriate.

## Success

Use toast/banner for:

- Order placed.
- Order cancelled.
- Watchlist added.
- Watchlist removed.
- Alert created.
- Alert updated.
- Alert deleted.

---

# 31. Financial Formatting

Create shared formatting utilities.

Examples:

```text
formatCurrency()
formatPercentage()
formatQuantity()
formatDateTime()
formatPnl()
```

Requirements:

- Consistent decimal precision.
- Consistent positive/negative signs.
- Consistent currency symbol based on backend/app configuration.
- Avoid manually concatenating currency strings across components.

P&L display should be unambiguous:

```text
+$142.30
+4.82%

-$53.10
-2.11%
```

Adapt exact formatting to the product's chosen market/currency.

---

# 32. Error Handling

Create a single API error-normalization pattern.

The frontend should distinguish:

```text
Network error
Authentication error
Validation error
Forbidden action
Not found
Server error
```

Map technical backend messages into readable UI copy where necessary.

Do not expose stack traces or raw server internals.

---

# 33. Types / Shared Contracts

Define shared TypeScript models based on the backend responses.

Likely entities:

```ts
User
Instrument
Quote
PriceHistoryPoint
Order
Position
PortfolioSummary
PortfolioPerformancePoint
AllocationItem
NewsItem
Sentiment
SentimentHistoryPoint
WatchlistItem
Alert
AlertRule
```

Do not prematurely create dozens of domain types.

Where the backend's exact response shape is uncertain, confirm the contract rather than relying on assumptions.

---

# 34. Backend Contract Items to Confirm Before Final UI Integration

The frontend team should obtain exact JSON examples for:

```text
POST /auth/login
POST /auth/register

GET /instruments/search
GET /instruments/:symbol

GET /market/quote/:symbol
GET /market/history/:symbol
GET /market/quotes

POST /orders
GET /orders
POST /orders/:id/cancel

GET /portfolio/summary
GET /portfolio/positions
GET /portfolio/performance
GET /portfolio/allocation
GET /portfolio/risk
GET /portfolio/snapshots

GET /news
GET /news/:symbol

GET /sentiment/:symbol
GET /sentiment/:symbol/history

GET /watchlist
POST /watchlist
DELETE /watchlist/:symbol

GET /alerts
POST /alerts/rules
GET /alerts/rules
PATCH /alerts/rules/:id
DELETE /alerts/rules/:id
```

Most important contract details:

### Order request

Confirm exact names/enums for:

- Symbol
- Side
- Order type
- Quantity
- Limit price
- Any additional fields

### Order status

Confirm exact enum values.

### Sentiment

Confirm:

- Sentiment enum names.
- Score range.
- Historical data format.
- Whether sentiment history references article IDs.

### Alerts

Confirm:

- Alert type enum.
- Rule status enum.
- Whether `GET /alerts` returns triggered alerts.
- How a rule transitions from active to triggered.
- Whether current price is included.
- Whether alert evaluation is server-side.

### Authentication

Confirm:

- Token/session mechanism.
- Required headers.
- Refresh behavior if applicable.
- Logout handling.

---

# 35. Work Breakdown — Developer 1

## Phase 1 — Foundation

- Inspect repository.
- Confirm routing and auth mechanism.
- Set up API service modules if missing.
- Establish shared types.
- Build app shell.
- Implement auth pages/route protection.

## Phase 2 — Search and Market

- Build `StockSearch`.
- Build stock detail route.
- Integrate instrument API.
- Integrate quote API.
- Integrate price history.
- Build `PriceChart`.

## Phase 3 — Trading

- Build Buy/Sell form.
- Build Market/Limit selection.
- Build validation.
- Build confirmation modal.
- Integrate `POST /orders`.
- Refresh portfolio/order data after successful order.
- Add cancel-order behavior.

## Phase 4 — Portfolio

- Dashboard summary.
- Holdings.
- Orders.
- Performance chart.
- Allocation chart.

## Phase 5 — Watchlist

- View watchlist.
- Add/remove.
- Bulk quote integration.
- Stock navigation.

## Phase 6 — Polish

- Loading states.
- Empty states.
- Errors.
- Responsive layouts.
- Integration with Developer 2's stock insight sections.

---

# 36. Work Breakdown — Developer 2

## Phase 1 — Shared Setup

- Inspect repository.
- Reuse shared API/state utilities.
- Coordinate stock route/type conventions with Developer 1.
- Reuse existing chart/toast/modal components.

## Phase 2 — News

- Global news if needed.
- Stock-specific news.
- News cards/list.
- Loading/error/empty states.

## Phase 3 — Sentiment

- Current sentiment card.
- Article sentiment badges.
- Sentiment history retrieval.
- Sentiment score visualization.

## Phase 4 — Price + Sentiment

- Transform price-history data.
- Transform sentiment-history data.
- Build synchronized timeline/overlay.
- Add event hover details.
- Handle missing data safely.

## Phase 5 — Alerts

- Alert form.
- Create alert.
- List alerts.
- Edit alert.
- Delete alert.
- Status badges.
- Triggered-state UI.

## Phase 6 — Notifications / Polish

- Alert polling/refetch.
- Trigger transition detection.
- In-app notifications.
- Responsive layout.
- Integrate with Developer 1's stock detail page.

---

# 37. Parallel Development Rules

To minimize merge conflicts:

## Shared files

Coordinate before editing:

```text
router configuration
global app layout
global styles
API client
shared type index
shared component index
theme/design tokens
```

## Developer 1 branch

Prefer:

```text
feature/trading
feature/portfolio
feature/watchlist
```

## Developer 2 branch

Prefer:

```text
feature/news
feature/sentiment
feature/alerts
```

Create small commits grouped by feature.

Avoid giant end-of-day commits.

---

# 38. Integration Contract Between Developers

Both developers must agree on these before implementation:

### Stock route

```text
/stocks/:symbol
```

### Symbol format

Use the backend's exact symbol format.

### Shared quote model

Both the price chart and insight components should consume the same normalized quote/history representation.

### Shared notification system

Both developers use the same toast system.

### Shared loading/error components

Do not create feature-specific copies when generic versions work.

### Stock page composition

Developer 1 owns the shell/layout.

Developer 2 plugs in:

```text
SentimentScorecard
SentimentTimeline
NewsList
AlertForm
```

without taking ownership of the entire page.

---

# 39. Testing Strategy

## Authentication

- Register succeeds.
- Invalid registration displays error.
- Login succeeds.
- Invalid credentials display error.
- Protected routes redirect correctly.
- Logout clears session.

## Search

- Search returns results.
- Empty search results work.
- Selecting stock routes correctly.

## Trading

- Buy market order.
- Sell market order.
- Buy limit order.
- Sell limit order.
- Invalid quantity rejected.
- Invalid limit price rejected.
- Backend rejection displayed.
- Successful trade refreshes portfolio/order/position views.

## Orders

- Order list loads.
- Empty state works.
- Cancel pending order works.
- Cancel failure displays correctly.

## Portfolio

- Summary loads.
- P&L formats correctly.
- Positions render.
- Performance chart renders.
- Allocation chart renders.

## Watchlist

- Add works.
- Remove works.
- Prices refresh.
- Clicking symbol opens stock page.

## News / Sentiment

- News loads.
- Stock-specific news loads.
- Sentiment loads.
- Bullish/Neutral/Bearish badges render.
- Missing sentiment does not break article rendering.
- Historical sentiment loads.

## Alerts

- Create target alert.
- Create stop-loss alert.
- Invalid price rejected.
- Edit alert works.
- Delete alert works.
- Triggered alert state appears.
- Notification is not repeatedly shown for the same trigger.

## Responsive

Test:

- Desktop
- Tablet
- Mobile

---

# 40. Demo-First Acceptance Flow

The frontend is considered hackathon-ready when a judge can perform this flow smoothly:

### Step 1

Log in.

### Step 2

See:

```text
Portfolio Value
Cash
P&L
Holdings
Performance
Watchlist
```

### Step 3

Search for a stock.

### Step 4

Open its stock page and see:

```text
Current price
Price chart
Sentiment
Recent news
```

### Step 5

Switch:

```text
BUY
MARKET
```

Enter quantity and place a simulated trade.

### Step 6

See updated:

```text
Order history
Position
P&L
Portfolio value
```

### Step 7

Return to the stock page.

Observe:

```text
Price movement
+
Sentiment timeline
+
Related news
```

### Step 8

Create:

```text
Target price
```

or

```text
Stop-loss
```

### Step 9

Show the active alert in the Alerts section.

This flow should be the primary QA target.

---

# 41. MVP Priorities

## Must Have

- Authentication
- Dashboard
- Stock search
- Stock detail page
- Current quote
- Price history chart
- Market/Limit paper trading
- Buy/Sell
- Order history
- Holdings
- P&L
- Portfolio performance
- Allocation
- Watchlist
- Financial news
- Bullish/Neutral/Bearish sentiment
- Sentiment history
- Price + sentiment visualization
- Target/stop-loss alerts
- Alert list
- In-app notifications
- Responsive UI
- Loading/error/empty states

## Nice to Have

- Portfolio risk metric
- Better chart tooltips
- Additional dashboard summaries
- More performance time ranges
- Better alert editing UX
- Subtle UI animation

## Explicitly Out of Scope

Do not build for MVP:

- Real-money trading
- Payment handling
- Advanced technical indicators
- Social media sentiment ingestion
- ML-based predictions
- Buy/sell recommendations
- Portfolio optimization
- Advanced risk models
- Browser push notifications
- Complex derivatives/options trading
- Multiple advanced order types
- Full financial-news reader
- Complex admin panel

---

# 42. Definition of Done

The frontend is complete when:

- Authentication works end-to-end.
- Protected navigation works.
- A stock can be searched and opened.
- Current quote and history render.
- Market and limit Buy/Sell orders can be submitted.
- Orders appear in history.
- Positions update after successful trades.
- Portfolio summary updates.
- P&L is visible.
- Performance and allocation charts work.
- Watchlist works.
- News loads.
- Sentiment loads.
- Sentiment history is visualized.
- Price and sentiment are shown on a common timeline.
- Target and stop-loss alerts can be created.
- Alerts can be viewed, edited, and deleted.
- Triggered alerts are surfaced in-app.
- Loading, empty, validation, and error states are implemented.
- Desktop and mobile layouts are usable.
- No frontend behavior relies on invented API routes.
- No UI makes investment recommendations or promises future price movement.

---

# 43. Final Implementation Principle

Keep the codebase simple.

The best hackathon implementation is not the one with the most screens. It is the one where the core story feels complete:

> **“I can safely practice trading a real stock, understand what the market news is saying, see how sentiment relates to price movement, and monitor my simulated position.”**

Everything that does not strengthen that story should be deprioritized.
