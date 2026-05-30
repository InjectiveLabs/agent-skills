---
name: injective-rfq-integrations
description: >-
  Integrate Injective RFQ taker flows into browser apps and operational quote
  monitors. Use this skill when building, reviewing, or debugging RFQ gateway
  autosign settlement, Web3Gateway AuthZ setup, manual TakerStream quote
  collection, RFQ open/close flows, conditional TP/SL intents, quote uptime
  probes, market-readiness checks, or mainnet RFQ frontend integrations.
  Covers mainnet parameters, canonical decimals, quote windows, signer slots,
  market discovery, quote-hit diagnostics, and production RFQ gotchas.
license: MIT
metadata:
  author: ck
  version: "1.0.0"
---

# Injective RFQ Integrations

Use this skill when adding Injective RFQ to a frontend or when building an RFQ
quote monitoring tool. Keep the main flow simple: prefer the RFQ gateway for
trade settlement, and use manual TakerStream only when you need raw quote
diagnostics.

## Mainnet Parameters

The canonical mainnet RFQ contract address is:

```ts
export const RFQ_CONTRACT_ADDRESS = 'inj1tkkj6vqdcmhhet6ja7rag77yqtuf3tyx9s4hfs'
export const RFQ_WS_URL = 'wss://rfq.ws.injective.network'
export const RFQ_GATEWAY_URL = 'https://rfq.gateway.grpc-web.injective.network/'
export const RFQ_CHAIN_ID = 'injective-1'
export const RFQ_EVM_CHAIN_ID = 1776
export const RFQ_COLLECT_QUOTES_MS = 500
```

`RFQ_CHAIN_ID` is the Cosmos chain ID used in RFQ quote payloads and Cosmos
sign docs. Do not set it to `1776`. `RFQ_EVM_CHAIN_ID` is the numeric Injective
EVM chain ID used in EIP-712 domains, Web3Gateway signatures, and
`quote.evmChainId`.

## Choose The Path

Use the gateway autosign path for production browser trading:

1. Connect an EVM wallet and derive the user's Injective address.
2. Create a local ephemeral autosign key for that wallet.
3. Grant AuthZ to the autosign key and to the RFQ contract through
   Web3Gateway fee payer.
4. Build canonical RFQ input from market metadata and mark price.
5. Call `IndexerGrpcRfqGwApi.fetchPrepareAutoSign`.
6. Sign the returned `TxRaw` exactly as received.
7. Insert both autosign and fee-payer signatures in decoded signer order.
8. Broadcast and poll the tx before reporting success.

Use manual TakerStream only for diagnostics, special routing, or quote uptime
checks. It exposes ACK/quote timing but does not return a prepared settlement
transaction.

## Production Rules

- Do not rebuild gateway transactions. Sign the returned `bodyBytes` and
  `authInfoBytes` exactly.
- Do not assume autosign is signer index `0`. Decode `AuthInfo.signerInfos`,
  normalize pubkeys, and fill signatures in decoded signer order.
- Normalize protobuf-wrapped pubkeys. `AuthInfo.signerInfos[].publicKey.value`
  can be `0a21...raw-key` while SDK public keys are raw 33-byte compressed
  keys.
- Canonicalize every signed decimal string. RFQ signatures bind string bytes,
  so `"110.0"` and `"110"` are different values.
- Use human price ticks for RFQ prices. Exchange `minPriceTickSize` is often
  quote-decimal scaled.
- Position close is RFQ too: opposite direction, same quantity, `margin: "0"`.
- After a successful close, cancel active TP/SL intent lanes for that market.
- Keep quote collection windows short. Production retail flows should start
  with `500 ms`.

## RFQ Input Rules

For open requests, derive quantity from stake, leverage, and mark price:

- `quantity = floor((margin * leverage) / mark, minQuantityTickSize)`
- long worst price = `mark + slippage`, rounded up to price tick
- short worst price = `mark - slippage`, rounded down to price tick

For closes:

- direction is the opposite of the open position side
- margin is exactly `"0"`
- quantity is the position quantity, floored to quantity tick
- worst price is still a guardrail

Worst price is a guardrail, not an expected execution price. Seeing better
quotes than `mark +/- slippage` is normal.

## AuthZ Setup

Use Web3Gateway fee payer for wallet-signed setup transactions so users do not
need an INJ balance just to authorize RFQ.

Grant two groups:

- App/autosign grantee: exchange order messages plus
  `/injective.wasmx.v1.MsgExecuteContractCompat`
- RFQ contract grantee:
  `/injective.exchange.v2.MsgPrivilegedExecuteContract`,
  `/injective.exchange.v2.MsgBatchUpdateOrders`, and
  `/cosmos.bank.v1beta1.MsgSend`

If setup asks users to pay gas, the integration is bypassing Web3Gateway.

## Quote Probe / Uptime Mode

For tools that only test whether market makers are quoting, read
[references/quote-probe-uptime.md](./references/quote-probe-uptime.md). A probe can send
RFQ requests and collect quotes without accepting them on-chain. The taker key
must sign RFQ requests, but the wallet does not need funds unless a quote is
accepted.

Measure bid/short and ask/long separately:

- `RFQs sent`: RFQ requests opened for that side
- `Requests quoted`: RFQs that received at least one MM quote
- `MM quotes`: total raw maker quote responses
- `Best bid` / `best ask`: best sorted price for the side

`MM quotes` can exceed `RFQs sent` because one RFQ can receive multiple maker
responses. For example, `100 RFQs`, `69/100 requests quoted`, and `140 MM
quotes` means 69 requests got at least one response and those requests received
140 total maker quotes.

## Conditional TP/SL

TP/SL is a signed RFQ close intent, not an orderbook reduce-only limit:

- long position TP: `mark_price_gte`, direction `short`, margin `"0"`
- long position SL: `mark_price_lte`, direction `short`, margin `"0"`
- short position TP: `mark_price_lte`, direction `long`, margin `"0"`
- short position SL: `mark_price_gte`, direction `long`, margin `"0"`

Fetch `epoch` and `lane_version` from the RFQ contract before signing. After
editing or canceling a lane, re-query before signing fresh intents.

## References

- [references/frontend-rfq-flow.md](./references/frontend-rfq-flow.md): gateway vs manual
  TakerStream, quote filters, and signer rules.
- [references/authz-and-autosign.md](./references/authz-and-autosign.md): Web3Gateway
  setup transactions and grant scopes.
- [references/quote-probe-uptime.md](./references/quote-probe-uptime.md): quote uptime
  dashboards, market discovery, fanout guardrails, and eligibility caching.
- [references/conditional-tpsl.md](./references/conditional-tpsl.md): RFQ conditional
  close intents.
- [references/troubleshooting.md](./references/troubleshooting.md): known symptoms and
  fixes.
