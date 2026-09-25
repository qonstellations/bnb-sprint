# PLAN.md — StockPulse Frontend: News, Sentiment & Alerts

## Role

You are **Frontend Developer 2** on the StockPulse hackathon team.

Your ownership is the **market insight and decision-support experience**: stock price visualization, financial news, simple Bullish/Neutral/Bearish sentiment, and configurable price alerts.

This is a hackathon MVP. The goal is to make StockPulse feel differentiated from a basic paper-trading simulator without building an overly complex analytics platform.

Developer 1 owns the trading engine UI, portfolio dashboard, holdings, orders, and core watchlist. Your work should integrate cleanly with those areas.

---

## Product Context

StockPulse is a paper-trading application intended to help users understand stock-market behavior by combining simulated trading with market informatio simplified MVP should support:

- Stock search
- Stock detail view
- Current stock price
- Basic historical price chart
- Financial news
- Bullish / Neutral / Bearish sentiment
- Sentiment displayed alongside stock-price movement
- Simple target-price alerts
- Simple stop-loss alerts
- In-app alert notifications
- Responsive fintech-style UI

Do not build advanced social-media analytics, technical indicators, portfolio risk mathematics, or a complex recommendation engine.

---

## Primary Goal

Build and plan the frontend workflow:

> **Search Stock → Inspect Price → Read News/Sentiment → Observe Sentiment vs Price → Set Alert → Receive Triggered Alert**

The resulting plan must be detailed enough for implementation without another architecture discussion.

---

## First Step: Inspect the Existing Repository

Before deciding on implementation details, inspect and document:

1. Frontend framework and version.
2. Build tool.
3. Routing.
4. Folder structure.
5. Existing design system/components.
6. Styling approach.
7. State-management solution.
8. Data-fetching/API utilities.
9. Existing authentication handling.
10. Existing chart library.
11. Existing notification/toast implementation.
12. Existing stock/ticker models.
13. Existing alert/news/sentiment API support.
14. Existing shared components created by Developer 1, if already present.

Reuse the repository's existing patterns wherever possible.

---

## Scope of Ownership

### A. Stock Search Integration

Provide the stock-search experience needed to reach a stock's insight page.

Requirements:

- Search ticker/company name.
- Show ticker + company name.
- Loading state.
- Empty state.
- Error state.
- Selecting a stock opens the stock detail page.
- Reuse Developer 1's search component or shared service rather than creating two competing implementations.

The stock-detail route should accept a symbol in a predictable format.

Example:

```text
/stocks/AAPL
```

Adapt this to the project's existing routing convention.

---

### B. Stock Header / Quote Visualization

On the stock detail page, present a compact overview:

- Company name
- Symbol
- Current price
- Daily price change
- Daily percentage change
- Last-updated indicator, if supported
- Basic historical price chart

Chart requirements:

- Clear line/area chart.
- Useful time ranges where data supports them.
- Hover/tap tooltip.
- Price axis.
- Time axis.
- Responsive resizing.
- Loading/empty/error state.

Do not build:

- RSI
- MACD
- Bollinger Bands
- Candlestick pattern analysis
- Complex technical-analysis tooling

The chart is primarily for understanding price movement relative to sentiment.

---

### C. Financial News Feed

Build a compact, useful financial-news section.

Each news item should display:

- Headline
- Source
- Publication time/date
- Related ticker, where available
- Sentiment label
- Link/open action if the backend provides an article URL

Suggested component:

```text
NewsCard
```

or

```text
NewsList
```

Handle:

- Loading
- No news
- API error
- Long headlines
- Missing source/time
- Duplicate/very similar items if the backend returns them

Do not implement a full news-reader page unless the repository already supports it.

---

### D. Sentiment Scorecard

The MVP sentiment model has exactly three user-facing categories:

- Bullish
- Neutral
- Bearish

Create a simple visual scorecard.

Possible presentation:

```text
Bullish    62%
Neutral    23%
Bearish    15%
```

or a simpler dominant-sentiment card such as:

```text
Overall Sentiment
BULLISH
+62 sentiment score
```

Use the actual backend representation if available.

The UI must distinguish:

- Individual article sentiment
- Overall/current stock sentiment

Do not imply a trading recommendation.

The frontend should present sentiment as market information, not as “buy/sell” advice.

---

### E. Sentiment + Price Correlation

This is one of the main visual differentiators of StockPulse.

Create a compact timeline/visualization that allows users to compare:

- Stock price movement
- News/sentiment events

Possible implementation:

- Price chart as the base layer
- Sentiment event markers along the timeline
- Bullish / Neutral / Bearish badges on event markers
- Hover interaction showing headline + sentiment
- Or two synchronized horizontal sections if chart-library overlays are difficult

The simplest implementation that communicates the relationship clearly is preferred.

Requirements:

- Same time window for price and news events where possible.
- Avoid misleading precision.
- Missing sentiment data should not break the chart.
- Show an explanatory empty state when correlation data is insufficient.

Do not claim causation. The UI should only show that price movement and sentiment events occurred around the same period.

---

### F. Alerts

Users should be able to create simple price alerts.

Supported alert types:

1. Target price
2. Stop-loss price

Inputs:

- Stock
- Alert type
- Trigger price

Optional:

- Quantity/position context, if backend already requires it

Validation:

- Trigger price must be valid.
- Trigger price should be appropriate for the current market price depending on the alert direction, if this rule is enforced by the backend.
- Clear invalid-input message.
- Avoid silently creating duplicate alerts unless the backend explicitly permits it.

---

### G. Alert List

Create a simple alerts section/page.

Each alert should show:

- Symbol
- Current price
- Alert type
- Trigger price
- Status
- Created time/date
- Delete/disable action

Suggested statuses:

- Active
- Triggered
- Disabled

Keep the interface simple enough for a demo.

---

### H. Triggered Alert Notification

When an alert is triggered:

- Show an in-app toast/banner.
- Make the triggered status visible in the alert list.
- Avoid showing repeated notifications for the same alert.
- Refresh alert state after trigger handling.

Use existing polling/event infrastructure if available.

Do not build browser push notifications unless they already exist.

---

## Data & API Planning

Inspect the actual API layer.

Conceptually, the frontend may need:

```text
GET    /stocks/search
GET    /stocks/:symbol
GET    /stocks/:symbol/history

GET    /stocks/:symbol/news
GET    /stocks/:symbol/sentiment
GET    /stocks/:symbol/market-insights

GET    /alerts
POST   /alerts
PATCH  /alerts/:id
DELETE /alerts/:id
```

These are illustrative, not requirements for exact route names.

For each real endpoint, document:

- HTTP method
- Request parameters/body
- Response format
- Auth requirements
- Error shape
- Loading state
- Refresh/invalidation behavior

If the backend does not yet provide news or sentiment APIs, define a small frontend adapter interface so mock data can be swapped for the real API later.

Example:

```ts
type NewsItem = {
  id: string;
  symbol: string;
  headline: string;
  source?: string;
  publishedAt: string;
  sentiment: "BULLISH" | "NEUTRAL" | "BEARISH";
  url?: string;
};
```

Adapt types to the backend rather than forcing this exact shape.

---

## State Management

Separate server state from UI state.

### Server state

Likely entities:

- Selected stock quote
- Historical prices
- News
- Sentiment
- Price/sentiment events
- Alerts

### UI state

Likely state:

- Search text
- Selected chart range
- Selected news filter
- Alert modal open/closed
- Alert type
- Alert price
- Notification visibility

Avoid storing fetched news/quotes globally unless the repository already uses a clear global-cache strategy.

---

## Refresh Strategy

The application should feel current without overengineering.

Plan:

- Poll or refetch quote data at a reasonable interval if required.
- Refresh news/sentiment less frequently.
- Refresh alerts when the page becomes active.
- Immediately invalidate/refetch relevant alert data after create/delete/update.
- Avoid several independent timers for the same resource.

If no real-time backend exists, make the UI architecture compatible with periodic refresh.

---

## Shared Components

Coordinate with Developer 1 so that common components are not duplicated.

Potential reusable components:

```text
StockSearch
StockHeader
PriceChange
PriceChart
NewsCard
NewsList
SentimentBadge
SentimentScorecard
SentimentTimeline
AlertModal
AlertForm
AlertList
AlertStatusBadge
Toast
LoadingSkeleton
EmptyState
ErrorState
```

Developer 1 may already create:

```text
AppLayout
MetricCard
Modal
StatusBadge
StockSearch
StockHeader
PriceChart
Toast
```

Use those shared components instead of rebuilding equivalents.

---

## UX Requirements

### Stock Insight Page

Organize information in a clear hierarchy:

```text
Stock Header
   ↓
Price + Chart
   ↓
Sentiment Scorecard
   ↓
Price/Sentiment Timeline
   ↓
Relevant News
   ↓
Set Price Alert
```

On desktop, news and sentiment can be presented alongside the chart where space permits.

On mobile, stack the sections vertically.

---

### Sentiment Language

Keep copy factual.

Good:

> “Current news sentiment: Bullish”

Good:

> “12 recent articles: 7 Bullish, 3 Neutral, 2 Bearish”

Avoid:

> “You should buy this stock.”

Avoid:

> “This stock will rise.”

The frontend presents information; it does not make investment recommendations.

---

## Error / Loading / Empty States

Define states for:

- Stock quote unavailable
- Chart data unavailable
- News feed empty
- News API failure
- Sentiment unavailable
- Insufficient data for sentiment timeline
- Alerts empty
- Alert creation failure
- Alert deletion failure
- Alert successfully created
- Alert successfully triggered

Error states should give users an understandable message and retry path.

---

## Performance Considerations

For a hackathon MVP:

- Lazy-load large/secondary pages where practical.
- Do not render dozens of expensive chart instances simultaneously.
- Avoid unnecessary re-renders from polling.
- Memoize expensive transformed chart data if needed.
- Limit the number of news articles initially rendered.
- Keep the stock-detail page responsive during data fetching.

Do not prematurely optimize.

---

## Definition of Done

Your implementation plan should cover a clear completion checklist:

- Stock search works.
- Stock detail route works.
- Current quote is displayed.
- Historical price chart renders.
- News feed renders.
- Each article can display a sentiment badge.
- Overall sentiment scorecard renders.
- Price/sentiment relationship is visualized.
- User can create a target-price alert.
- User can create a stop-loss alert.
- User can view active/triggered alerts.
- User can delete/disable an alert.
- Triggered alerts produce an in-app notification.
- Loading/empty/error states exist.
- UI is responsive.
- No unsupported claims or trading recommendations are presented.

---

## Deliverable: The Plan

Produce a detailed execution plan in `PLAN.md`.

Structure it as:

### 1. Repository Findings
Identify existing technologies, components, routes, services, and APIs to reuse.

### 2. Architecture
Define routes, component boundaries, data flow, and state management.

### 3. API Contracts
Document actual available APIs. Where unavailable, define minimal adapter/mock interfaces.

### 4. Screen-by-Screen Implementation Plan
Cover:

- Stock search
- Stock detail
- Price chart
- News
- Sentiment
- Price/sentiment visualization
- Alerts
- Notification behavior

For every task include:

- What to build
- Components/files involved
- Dependencies
- Acceptance criteria

### 5. UI / UX Specification
Describe layout, interactions, responsive behavior, and important states.

### 6. Data Refresh Strategy
Explain polling/refetch behavior and mutation invalidation.

### 7. Testing Checklist
Include critical manual and automated test cases.

### 8. Developer Handoff Notes
Explicitly document integration points for Developer 1:

- Stock-detail route
- Stock search
- Shared types
- Shared chart components
- Shared notifications
- Watchlist integration
- Any API assumptions

### 9. Hackathon Priorities
Clearly separate:

- Must-have
- Nice-to-have
- Out of scope

The final plan should be concrete, incremental, and implementation-ready. Favor a small number of polished flows over feature creep.





# PLAN.md — StockPulse Frontend: Trading & Portfolio

## Role

You are **Frontend Developer 1** on the StockPulse hackathon team.

Your ownership is the **core trading and portfolio experience**. Your work should make it possible for a user to enter the app, find a stock, place a simulated trade with virtual cash, see the resulting holding, and understand their portfolio value and P&L.

This is a hackathon MVP. Favor a clean, convincing, reliable implementation over unnecessary abstraction or advanced financial features.

---

## Product Context

StockPulse is a paper-trading web application that lets users practice stock trading without risking real money.

The MVP should support:

- Virtual cash
- Market and limit buy/sell orders
- Order confirmation
- Order history
- Current holdings / positions
- Portfolio value
- Cash balance
- P&L / returns
- Basic portfolio performance chart
- Basic asset allocation chart
- Simple watchlist
- Stock search
- Responsive fintech-style UI

The second frontend developer owns news, sentiment, stock insight visualizations, and price alerts. Build your areas so they can be integrated without duplicating responsibility.

---

## Your Primary Goal

Design and plan the frontend implementation for:

> **Search Stock → View Stock → Place Paper Trade → See Order/Position → Track Portfolio & P&L**

Your plan should be implementation-ready for another developer. Do not produce vague statements such as “build the dashboard.” Break work down into concrete pages, components, states, data requirements, and integration points.

---

## First Step: Inspect the Existing Repository

Before proposing implementation details, inspect the repository and identify:

1. Frontend framework and version.
2. Build tool.
3. Existing routing solution.
4. Current folder structure.
5. Existing component/design system.
6. Styling approach.
7. State-management solution, if any.
8. Data-fetching/API utilities, if any.
9. Existing authentication implementation.
10. Existing charting library, if any.
11. Existing environment-variable conventions.
12. Existing API/service layer and available endpoints.
13. Existing reusable table, modal, form, toast, and card components.
14. Existing TypeScript types/interfaces for users, stocks, orders, positions, or portfolios.

Do not assume a technology that the repository already has not adopted. Reuse existing patterns where practical.

---

## Scope of Ownership

### A. Application Shell

Plan the frontend structure for:

- Protected application layout
- Sidebar/top navigation
- Dashboard route
- Trade/stock-detail route
- Portfolio route
- Orders/history route if separated
- Watchlist section
- Shared account/cash summary

Navigation should clearly expose:

- Dashboard
- Trade
- Portfolio
- Orders
- Watchlist

Do not create unnecessary pages.

---

### B. Stock Search

Implement a simple, fast stock search experience.

Requirements:

- Search by ticker or company name.
- Show ticker + company name in results.
- Handle loading state.
- Handle no-results state.
- Handle API error state.
- Clicking a result opens the stock detail/trading view.
- Debounce server-side search if the existing API benefits from it.
- Keep the interaction simple enough for a demo.

Potential reusable component:

`StockSearch`

Possible data shape:

```ts
type StockSearchResult = {
  symbol: string;
  name: string;
};
```

Adapt this to the repository's actual API types.

---

### C. Stock Detail + Trading Page

Create the main page where the user can inspect a stock and trade it.

Display:

- Company name
- Ticker
- Current price
- Daily price change
- Daily percentage change
- Basic price chart
- User's current position in that stock, when applicable
- Available virtual cash
- Order form

Order form requirements:

- Buy/Sell toggle
- Market/Limit toggle
- Quantity input
- Limit-price input only for limit orders
- Estimated order value
- Estimated remaining cash for buy orders
- Estimated position impact
- Validation messages
- Submit button
- Confirmation state/modal

Rules for the frontend:

- Disable limit-price input for market orders.
- Require quantity > 0.
- Require limit price for limit orders.
- Prevent obviously invalid client-side submissions.
- Do not rely only on client-side validation; display backend validation errors too.
- Format currency and quantities consistently.

Keep the order experience visually clear and compact.

---

### D. Order Confirmation

Plan a lightweight confirmation step before submitting an order.

For example:

```text
Buy
AAPL
10 shares
Market Order
Estimated Value: $2,100
```

Then:

- Confirm
- Cancel

After success:

- Show success toast/banner.
- Refresh relevant order/position/portfolio data.
- Keep the user on the current workflow unless the UX clearly benefits from navigation.

---

### E. Orders / Order History

Provide a simple order-history interface.

Each row should include, where supported by the backend:

- Date/time
- Symbol
- Buy/Sell
- Market/Limit
- Quantity
- Price or limit price
- Status
- Total value

Minimum statuses:

- Pending
- Filled
- Cancelled
- Rejected

Include:

- Loading state
- Empty state
- Error state

Avoid building advanced filtering unless it is already inexpensive to support.

---

### F. Current Holdings / Positions

Create a reusable holdings table.

Display:

- Symbol
- Company
- Quantity
- Average price
- Current price
- Current value
- P&L
- P&L %

Use clear positive/negative visual treatment.

For zero-position cases, provide an informative empty state rather than an empty table.

---

### G. Portfolio Dashboard

The dashboard is the first screen after login.

Required metrics:

1. Total portfolio value
2. Available cash
3. Total return / P&L
4. Number of active positions

Use compact metric cards.

Also include:

- Holdings preview
- Basic asset allocation chart
- Basic portfolio performance chart
- Watchlist preview

A user should understand their current financial state within a few seconds.

---

### H. Performance Chart

Plan one simple portfolio history chart.

Requirements:

- Time range options if historical data exists (for example 1D / 1W / 1M / 3M).
- Tooltip with date and portfolio value.
- Clear empty state if insufficient history exists.
- Responsive sizing.

Do not build advanced technical-analysis indicators.

---

### I. Asset Allocation Chart

Create a basic allocation visualization.

For example:

- Donut chart or pie chart.
- Each holding represented by percentage of invested/current portfolio value.
- Legend showing ticker and percentage.
- Handle a portfolio with cash but no positions.
- Provide a sensible empty state.

The exact chart style should follow the repository's existing visualization library.

---

### J. Watchlist

Keep the watchlist intentionally simple.

Requirements:

- Add stock.
- Remove stock.
- Show ticker, name, current price, and daily change if available.
- Clicking a stock opens its trading/detail view.
- Loading/error/empty states.

The second developer may consume or reference watchlist data for stock insights. Keep the underlying type/API interface reusable.

---

## Data & API Planning

Inspect the actual API layer before writing the implementation plan.

At minimum, determine whether the frontend can access concepts equivalent to:

```text
GET    /stocks/search
GET    /stocks/:symbol
GET    /stocks/:symbol/history

GET    /portfolio
GET    /portfolio/performance
GET    /positions
GET    /orders
POST   /orders

GET    /watchlist
POST   /watchlist
DELETE /watchlist/:symbol
```

These are illustrative only. Use the real repository endpoints when available.

For every endpoint you plan to use, document:

- Request shape
- Response shape
- Authentication requirements
- Loading behavior
- Error behavior
- Refresh/invalidation strategy

If the backend is incomplete, explicitly identify the missing contract and propose a frontend mock/service interface that can be replaced later without rewriting UI components.

---

## State Management

Define clearly:

### Server state
Use the repository's existing data-fetching solution where available.

Likely server-state entities:

- Current user
- Virtual cash
- Stock quote
- Stock history
- Positions
- Orders
- Portfolio summary
- Portfolio history
- Watchlist

### UI state

Examples:

- Selected symbol
- Buy/Sell selection
- Market/Limit selection
- Quantity
- Limit price
- Confirmation modal open/closed
- Search query
- Selected performance range

Do not place server data into global client state unnecessarily.

---

## Refresh / "Real-Time" Behavior

This is a paper-trading app, so the frontend needs to feel responsive without overengineering.

Plan a simple strategy such as:

- Refresh quotes periodically.
- Refresh portfolio/position/order data after a successful trade.
- Invalidate related queries after mutations.
- Avoid aggressive polling for every screen.
- Clearly show the last updated time if useful.

Do not implement WebSockets unless they already exist or are trivial to use.

---

## UX Requirements

Define specific states for every important interaction:

### Loading
Use skeletons/spinners without causing large layout jumps.

### Empty
Examples:

- No positions
- No orders
- Empty watchlist
- No historical portfolio data

### Error
Show a human-readable error and a retry path.

### Success
Use a toast/banner after successful:

- Order placement
- Watchlist add/remove

### Validation
Show inline validation near fields.

### Mobile
Trading form, holdings tables, and dashboard cards must remain usable on smaller screens.

---

## Shared Component Strategy

Identify reusable components rather than duplicating markup.

Likely shared components:

```text
AppLayout
TopBar
Sidebar
MetricCard
StockSearch
StockHeader
PriceChange
PriceChart
OrderForm
OrderConfirmationModal
HoldingsTable
OrdersTable
AllocationChart
PerformanceChart
Watchlist
StatusBadge
EmptyState
ErrorState
LoadingSkeleton
Toast
```

Do not create components only to split trivial markup. Components should correspond to reusable UI or meaningful business behavior.

---

## Visual Direction

Aim for a modern trading/fintech product:

- Strong hierarchy
- Dense but readable information
- Clear positive/negative P&L
- Consistent currency formatting
- Consistent spacing
- Compact cards and tables
- Responsive charts
- Minimal decorative UI

Do not spend time on elaborate animation.

---

## Security / Reliability Considerations

Frontend must not:

- Treat virtual cash as authoritative.
- Calculate a final execution result and assume it is valid.
- Expose secrets.
- Hard-code user-specific financial data.
- Assume a successful HTTP request means the order is filled unless the API says so.

The backend remains authoritative for balances, executions, positions, and P&L.

---

## Definition of Done

Your implementation plan must define a clear completion checklist covering:

- Authentication route protection works.
- User can search for a stock.
- User can open a stock detail page.
- User can place a market order.
- User can place a limit order.
- User can buy and sell.
- Order confirmation works.
- Successful orders update UI state.
- Order history is visible.
- Current positions are visible.
- P&L is visible.
- Portfolio summary is visible.
- Performance chart works.
- Allocation chart works.
- Watchlist works.
- Loading/empty/error states exist.
- Main UI is responsive.

---

## Deliverable: The Plan

Produce a detailed execution plan in `PLAN.md`.

Structure it as:

### 1. Repository Findings
What already exists and what should be reused.

### 2. Architecture
Routes, folders, component boundaries, data-flow, and state management.

### 3. API Contracts
Real endpoints and payloads, or explicitly proposed mock interfaces where the backend is missing.

### 4. Implementation Tasks
Break work into small ordered tasks. Every task should state:

- What to build
- Files/components likely affected
- Dependencies
- Acceptance criteria

### 5. UI / UX Details
Describe each screen and important interaction.

### 6. Integration Strategy
Explain how trading, portfolio, orders, and watchlist data stay synchronized.

### 7. Error / Loading / Empty States
List the important states.

### 8. Testing Checklist
Include critical manual and automated test cases.

### 9. Developer Handoff Notes
Document anything Developer 2 needs to know, especially:

- Shared types
- Stock search
- Watchlist
- Stock-detail route
- Reusable chart components
- Shared API/query utilities

### 10. Hackathon Priorities
Separate:

- Must-have
- Nice-to-have
- Explicitly out of scope

The final plan should be practical enough that implementation can begin immediately without another architecture discussion.
