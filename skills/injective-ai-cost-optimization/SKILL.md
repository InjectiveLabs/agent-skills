---
name: injective-ai-cost-optimization
description: Optimize AI API costs for agentic trading bots. Covers Anthropic token cost tracking, web search cost management, CoinGecko/Massive.com data sourcing, shared caching strategies, and per-user cost caps. Learned from real production data showing web search inflates costs 10-17x.
license: MIT
metadata:
  author: ckhbtc
  version: "1.0.0"
  filePattern:
    - "**/triggers*"
    - "**/technicals*"
    - "**/strategies*"
  bashPattern:
    - "anthropic"
    - "coingecko"
    - "massive"
---

## AI Cost Optimization for Agentic Trading

Real-world cost data from production deployment on Injective DEX with Claude Haiku 4.5.

## When to Apply

- When building AI-powered trading bots that make periodic API calls
- When optimizing Anthropic/OpenAI API spend for multi-user platforms
- When choosing between web search, external data APIs, and cached data
- When setting per-user cost limits or pricing for x402/subscription models

## Cost Reality: Web Search vs Technical Indicators

**Production data (Claude Haiku 4.5, 15-min intervals):**

| Call Type | Input Tokens | Output Tokens | Cost/Call | Daily (96 calls) |
|---|---|---|---|---|
| With web search (`web_search_20250305`) | 20,000–44,000 | ~1,000 | **$0.03–0.05** | **$3–5/user** |
| Without search (technicals only) | 650–2,600 | ~500 | **$0.003** | **$0.30/user** |

**Web search is 10-17x more expensive** — not because of the $0.01/search fee, but because Anthropic injects 20K-44K tokens of web page content into the input context.

## Architecture: Shared Data Cache

### The Key Insight

Market data is the same for all users. Don't fetch it per-user — cache it globally.

```
CoinGecko (crypto) ──┐
                      ├── Shared Cache (15 min TTL) ──→ All user AI calls
Massive.com (equities)┘
```

### Data Sources

| Asset Class | Source | Cost | What You Get |
|---|---|---|---|
| Crypto (BTC, ETH, etc.) | CoinGecko free tier | Free (no API key) | 200 daily closes, 7d/14d/30d/60d/200d/1y changes, market cap, volume, ATH |
| Equities (NVDA, TSLA, etc.) | Massive.com API | API key required | 200+ daily OHLC bars, volume |
| Forex (EUR, GBP) | Massive.com API | `C:EURUSD` format | Same as equities |
| Commodities (XAU, XAG) | Massive.com API | `C:XAUUSD` format | Same as equities |
| Oil | Massive.com API | `USO` (ETF ticker) | Same as equities |

### CoinGecko Free Tier Endpoints

```
# Per-coin detailed data (7d/30d/200d changes, ATH, volume)
GET /api/v3/coins/{id}?localization=false&tickers=false&community_data=false&developer_data=false

# 200 daily closes for technical indicators
GET /api/v3/coins/{id}/market_chart?vs_currency=usd&days=200&interval=daily
```

**Rate limits**: 5-15 calls/minute (free), 30/minute (demo key). Add 1.5s delay between requests. Use optimistic lock to prevent thundering herd:

```typescript
let _fetchInProgress = false
if (staleSymbols.length > 0 && !_fetchInProgress) {
  _fetchInProgress = true
  try { /* fetch */ } finally { _fetchInProgress = false }
}
```

### Massive.com API

```
GET /v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}?apiKey={key}&limit=250&sort=asc&adjusted=true
```

Tickers: stocks direct (`NVDA`), forex with `C:` prefix (`C:EURUSD`), commodities (`C:XAUUSD`, `USO` for oil).

## Technical Indicators from Cached Data

Compute these from 200 daily closes — zero API cost:

| Indicator | Formula | Use |
|---|---|---|
| EMA(9/21/50/200) | Exponential moving average | Trend direction |
| MACD(12,26,9) | EMA(12) - EMA(26), signal = EMA(9) of MACD | Momentum + crossovers |
| RSI(14) | Relative strength index | Overbought/oversold |
| Bollinger Bands(20,2) | Mean ± 2σ of last 20 closes | Volatility + breakouts |

These replace web search entirely. The AI gets structured data (EMAs, MACD signal, RSI value) instead of 40K tokens of raw web pages. Better signal, 10x cheaper.

## Per-Call Cost Tracking

Log token counts from every Anthropic response:

```typescript
const inputTokens = response.usage?.input_tokens ?? 0
const outputTokens = response.usage?.output_tokens ?? 0
const HAIKU_INPUT_PER_M = 0.80
const HAIKU_OUTPUT_PER_M = 4.00
const tokenCost = (inputTokens * HAIKU_INPUT_PER_M + outputTokens * HAIKU_OUTPUT_PER_M) / 1_000_000
logger.info({ inputTokens, outputTokens, tokenCost: `$${tokenCost.toFixed(4)}` }, 'API call cost')
```

### Admin-Only Cost Dashboard

Expose a `/api/costs` endpoint with rolling 24h summary:

```typescript
// Protect with admin wallet check
const admins = (process.env.ADMIN_WALLETS ?? '').split(',').map(s => s.trim())
if (!admins.includes(wallet)) return c.json({ error: 'Admin access required' }, 403)
return c.json(getCostSummary())
```

## Cost Control Levers

### 1. Poll Interval (biggest lever)

| Interval | Calls/Day | Token Cost/User | Use Case |
|---|---|---|---|
| 5 min | 288 | ~$0.86 | Scalping (too expensive for most) |
| 15 min | 96 | ~$0.29 | Active trading (recommended default) |
| 30 min | 48 | ~$0.14 | Swing trading |
| 1 hour | 24 | ~$0.07 | Position trading |

### 2. Symbol Count per Strategy

Output tokens scale linearly with symbol count. Cap at 10 symbols per strategy:

```typescript
max_tokens: Math.max(1024, strategy.symbols.length * 200)
```

At 9 symbols with 1024 max_tokens, the AI runs out of space and returns truncated (unparseable) JSON.

### 3. Strategy Count per User

Cap at 3 strategies per user. Each strategy = 1 AI call per tick. Maximum cost exposure = 3 strategies × 10 symbols × 96 ticks/day = ~$2.90/day.

### 4. Web Search (disabled by default)

If re-enabling, use a shared cache:

```typescript
const NEWS_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
// One search for ALL users, cache per symbol
// Reduces 100 users × 96 ticks = 9,600 searches/day to ~24 searches/day
```

### 5. Model Selection

| Model | Input/M | Output/M | Best For |
|---|---|---|---|
| Haiku 4.5 | $0.80 | $4.00 | Trading signals (default, fast, cheap) |
| Sonnet 4 | $3.00 | $15.00 | Complex analysis (4x more expensive) |

Haiku is sufficient for structured signal generation from technical data.

## Pricing for x402 / Subscription

Based on production data:

| Metric | Value |
|---|---|
| Cost per tick (no search) | ~$0.003 |
| Cost per user per day (15 min, 1 strategy) | ~$0.30 |
| Cost per user per day (15 min, 3 strategies) | ~$0.90 |
| Worst case per user per day | ~$2.90 |
| Suggested x402 price per tick | $0.01–0.03 (3-10x markup) |
| Suggested monthly subscription | $15–30/user |

## Anti-Patterns

- **Web search on every tick** — 10-17x cost for marginal value. Use cached technicals.
- **Per-user data fetches** — CoinGecko/Massive data is identical for all users. Cache globally.
- **No `max_tokens` scaling** — fixed 2048 tokens for 2 symbols wastes money. Scale with symbol count.
- **Permanent faucet blocklist** — if faucet amount is wrong, user can never retry. Use time-based cooldown.
- **No cost logging** — you can't optimize what you can't measure. Log every `response.usage`.
