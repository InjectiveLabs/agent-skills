# RFQ Quote Probe and Uptime Lessons

Use this reference when building tools that check whether Injective RFQ market
makers are actively quoting new or existing markets. This is different from a
retail trading flow: the tool usually sends RFQ requests, collects quotes, and
does not accept them on-chain.

## Mainnet probe defaults

- Environment: `mainnet`
- Cosmos chain ID: `injective-1`
- EIP-712 / EVM chain ID: `1776`
- RFQ contract: `inj1tkkj6vqdcmhhet6ja7rag77yqtuf3tyx9s4hfs`
- TakerStream: `wss://rfq.ws.injective.network/injective_rfq_rpc.InjectiveRfqRPC/TakerStream`
- Gateway: `https://rfq.gateway.grpc-web.injective.network/`
- Quote collection window: `500 ms` by default, but use milliseconds in config
  so operators can test `30`, `100`, `500`, and larger windows.

Use the canonical mainnet RFQ contract address above for new integrations.

## Market discovery

Do not hardcode a static list of market IDs for uptime checks. Pull active
derivative markets from the Injective derivatives market endpoint and filter to
the quote denom the RFQ deployment supports. Refresh that list on manual
refresh and on a background interval so newly listed markets are picked up
automatically.

For dashboards, sort by operational status first, then a stable priority:

1. quoting markets
2. degraded markets
3. silent markets
4. probe errors

Within each status group, put high-importance markets first. A static
market-cap priority table is acceptable; CoinGecko-backed market-cap refreshes
can be added later and cached daily.

## Request semantics

Treat each side as its own RFQ:

- Bid / short: the taker is selling; higher quote price is better.
- Ask / long: the taker is buying; lower quote price is better.

For health checks, send short then long sequentially. Sequential collection
makes streaming UI clearer and avoids making it ambiguous whether missing bids
or asks are caused by side-specific quoting behavior or simultaneous request
load.

The request's `worst_price` is a guardrail, not the expected execution price.
With a `50 bps` guard, derive:

- long worst price = mark price plus slippage, rounded up to price tick
- short worst price = mark price minus slippage, rounded down to price tick

Good maker quotes should usually be inside that guard. Seeing better prices
than `mark +/- slippage` is normal because the guard is only the maximum or
minimum acceptable price.

## What to measure

Display these metrics separately:

- `RFQs sent`: number of RFQ requests opened for a side.
- `Requests quoted`: number of RFQs that received at least one maker quote.
- `MM quotes`: total raw maker quote responses.
- `Best bid` / `best ask`: best price after sorting by side.
- `Latency`: elapsed quote collection time for the side or market.

`MM quotes` can be greater than `RFQs sent`. One RFQ can receive quotes from
multiple MMs, so `100 RFQs`, `69/100 requests quoted`, and `140 MM quotes`
means 69 RFQ requests got at least one response and those successful requests
received 140 total maker quote responses.

For public status APIs, expose both the side-level health and the counts. Do
not collapse everything into one boolean unless the consumer only needs a
coarse eligibility flag.

## Fanout and load testing

To test RFQ routing with multiple taker addresses, generate or derive a pool of
taker addresses and fan out row-level requests across that pool. Keep this
scoped to a selected market; do not multiply full-dashboard refreshes by the
taker count.

Operational guardrails:

- cap the configured taker count
- cap concurrent TakerStream connections separately from taker count
- stream results as each request returns
- keep full refreshes single-taker unless intentionally load testing
- make row-level load-test controls visually distinct from global refresh

A practical default is 100 takers for a single selected market with fanout
concurrency around 10 streams at a time. Scaling to thousands should be a
separate load-test mode with explicit server resource monitoring.

## Funds and settlement

A quote uptime probe does not need funds if it never accepts quotes. It only
needs a taker key capable of signing RFQ requests. Settlement, real trades, and
gateway prepared autosign flows still need the appropriate AuthZ grants and
margin/gas setup described in the main skill.

If the goal is merely "are MMs quoting this market?", it is acceptable for the
eventual transaction to fail or never be submitted. Keep the probe path
read-only from a trading perspective.

## Minimal caching for eligibility

For market-readiness APIs, store only the minimal data needed to answer uptime
questions:

- timestamp
- market ID and ticker
- side statuses
- RFQs sent
- requests quoted
- raw maker quote counts
- best bid / best ask, if present
- probe latency

A useful frontend eligibility rule for newly listed markets:

- poll all markets hourly
- when a new market appears, poll that market every five minutes
- mark `frontendEligible: true` after 3 consecutive live samples, or at least
  75% live samples over one hour
- once eligible, keep it eligible; do not automatically downgrade it

This gives frontend consumers a conservative "safe to show" signal without
requiring a long historical window on day one.
