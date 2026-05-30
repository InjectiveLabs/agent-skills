# Architecture

## Components

An RFQ-enabled browser app usually has six local modules:

1. Wallet connection
2. Web3Gateway fee-payer broadcaster for setup transactions
3. AuthZ and local autosign key storage
4. RFQ request builder
5. RFQ gateway settlement broadcaster
6. RFQ conditional TP/SL manager

Only the app's non-secret backend endpoints should run server-side. The user
wallet signs AuthZ and conditional TP/SL intents in the browser. Setup
transactions go through Web3Gateway fee payer. The local autosign key signs RFQ
settlement transactions in the browser.

## AuthZ Setup

```mermaid
sequenceDiagram
  participant U as User Wallet
  participant FE as Frontend
  participant W3 as Web3Gateway
  participant CH as Injective

  U->>FE: Connect wallet
  FE->>FE: Generate local autosign key
  FE->>W3: prepareExchangeTxRequest(MsgGrant)
  W3->>FE: EIP-712 typed data + fee-payer fields
  U->>FE: Sign typed data
  FE->>W3: broadcastTxRequest(signature, prepared)
  W3->>CH: Broadcast fee-paid grant tx
```

This is the path that removes the user's need to hold INJ for setup gas.

## Open Position

```mermaid
sequenceDiagram
  participant U as User Wallet
  participant FE as Frontend
  participant GW as RFQ Gateway
  participant MM as Makers
  participant CH as Injective

  U->>FE: Existing AuthZ session
  FE->>GW: fetchPrepareAutoSign(RFQ, 500ms)
  GW->>MM: Fan out RFQ request
  MM->>GW: Signed quotes
  GW->>FE: TxRaw + fee payer sig + selected quotes
  FE->>FE: Sign TxRaw with local autosign key
  FE->>CH: Broadcast completed TxRaw
```

## Close Position

Close uses the same settlement path as open:

- opposite direction
- existing position quantity
- `margin: "0"`
- price protection from mark price

The app should also cancel any active conditional TP/SL lane after a
reduce-only close.

## TP/SL

TP/SL is off-chain until triggered:

```mermaid
sequenceDiagram
  participant U as User Wallet
  participant FE as Frontend
  participant IDX as RFQ Indexer
  participant MM as Makers
  participant CH as Injective

  FE->>CH: Query taker_intent_state
  U->>FE: Sign SignedTakerIntent EIP-712
  FE->>IDX: createConditionalOrder(order, signature)
  IDX->>IDX: Watch mark price
  IDX->>MM: Request quotes when trigger hits
  MM->>IDX: Signed quotes
  IDX->>CH: accept_signed_intent
```

## State Boundaries

Local browser state:

- connected EVM address
- derived Injective address
- local autosign key, keyed by granter address
- current market metadata cache

Indexer state:

- RFQ request ACKs and quote stream
- active conditional orders
- settlements

Contract state:

- AuthZ grants
- RFQ maker registry
- taker intent `epoch`
- taker intent `lane_version`

Do not derive contract replay counters locally. Query them.
