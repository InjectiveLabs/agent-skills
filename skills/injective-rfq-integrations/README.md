# Injective RFQ Integrations

Integration guide and browser TypeScript examples for adding Injective RFQ
taker flows to a frontend application.

This repo is an implementation reference for browser applications that want to
add Injective RFQ taker flows:

- user connects an EVM wallet and derives an Injective address
- user grants scoped AuthZ once through Web3Gateway fee payer
- app sends RFQs with a short quote collection window
- app settles through the RFQ gateway prepared autosign transaction path
- position close is the same RFQ path with `margin: "0"`
- TP/SL uses signed RFQ conditional close intents, not orderbook reduce-only
  orders

The skill is intentionally compact. It points to focused references only when
an agent needs implementation detail.

## Start Here

Read these in order:

1. [SKILL.md](./SKILL.md) - the full implementation playbook.
2. [references/architecture.md](./references/architecture.md) - flow diagrams and state
   boundaries.
3. [references/frontend-rfq-flow.md](./references/frontend-rfq-flow.md) - quote windows,
   ACKs, gateway settlement, and manual TakerStream collection.
4. [references/quote-probe-uptime.md](./references/quote-probe-uptime.md) - quote uptime
   probes, market discovery, fanout limits, and frontend eligibility signals.
5. [references/authz-and-autosign.md](./references/authz-and-autosign.md) - grants,
   ephemeral keys, Web3Gateway fee-payer setup.
6. [references/conditional-tpsl.md](./references/conditional-tpsl.md) - RFQ
   TP/SL signed intents.
7. [references/troubleshooting.md](./references/troubleshooting.md) - common failures.

## Recommended Integration Path

Most frontend partners should use the RFQ gateway autosign flow:

1. Grant AuthZ to a local ephemeral key and to the RFQ contract.
   Use Web3Gateway fee payer for this wallet-signed setup transaction.
2. Build a canonical RFQ request from market metadata and mark price.
3. Call `IndexerGrpcRfqGwApi.fetchPrepareAutoSign`.
4. Locally sign the returned `TxRaw` with the ephemeral autosign key.
5. Insert the gateway fee-payer signature.
6. Broadcast via `TxGrpcApi.broadcast`.
7. For TP/SL, sign `SignedTakerIntent` EIP-712 and submit conditional orders.

Use the lower-level TakerStream sample only when you need to manually inspect
ACKs and quotes in the browser.

## Production Lessons

- Do not rebuild the gateway transaction. Sign the returned `bodyBytes` and
  `authInfoBytes` exactly.
- Prepared tx signer pubkeys can be raw compressed keys or protobuf-wrapped
  `Any.value` bytes. Normalize before matching signer indexes.
- Never assume autosign is signer index `0`. Fee payer can appear first.
- `signature verification failed` usually means wrong account number,
  chain-id, sign bytes, or signature slot. Check signer index matching before
  changing RFQ business logic.
- Position close is RFQ too: opposite direction, same quantity, `margin: "0"`,
  then cancel active TP/SL lanes for that market.
- Quote probes should report both request hit rate and raw maker quote count:
  `69/100 requests quoted` and `140 MM quotes` are different metrics.
- Use active derivative market discovery for uptime tools; do not hardcode
  market IDs when checking whether new markets are ready.
- Tx hashes should link to
  `https://tcx.inj.so/tx/<hash>?network=mainnet&mode=all`.

## Security Notes

- Do not store user wallet private keys.
- If you use autosign, the ephemeral grantee key is a local browser secret.
- Scope grants tightly. Avoid blanket contract execution unless the RFQ flow
  truly requires it.
- Route wallet-signed setup transactions through Web3Gateway fee payer so
  users do not need an INJ balance for gas.
- Conditional TP/SL signatures are replay protected by `epoch` and
  `lane_version`. Always re-query counters after canceling a lane.
- Never mutate decimals after signing. RFQ signatures bind canonical string
  values.

## Mainnet Defaults

```ts
// Canonical mainnet RFQ contract.
export const RFQ_CONTRACT_ADDRESS = 'inj12stwq95jet57edcu4a65r48r46s9rzrs938n8k'

export const RFQ_WS_URL = 'wss://rfq.ws.injective.network'
export const RFQ_GATEWAY_URL = 'https://rfq.gateway.grpc-web.injective.network/'
export const RFQ_CHAIN_ID = 'injective-1'
export const RFQ_EVM_CHAIN_ID = 1776
export const RFQ_COLLECT_QUOTES_MS = 500
```

`RFQ_CHAIN_ID` is the Cosmos chain ID used in RFQ quote/conditional-order wire
payloads and Cosmos sign docs. Do not set it to `1776`. `RFQ_EVM_CHAIN_ID` is
the numeric Injective EVM chain ID used in EIP-712 domains, Web3Gateway
wallet signatures, and `quote.evmChainId`.

## Status

This skill is intentionally docs-only. It is not an npm package.
