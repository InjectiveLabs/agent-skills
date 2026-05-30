# AuthZ And Autosign

## Why Autosign

RFQ settlement should feel instant after the user authorizes trading. The app
uses a local ephemeral key as an AuthZ grantee so the user does not sign every
settlement.

The key stays in browser storage and is scoped per granter Injective address.

## Grants

Build `MsgGrant` for both app grantee messages and RFQ contract messages.

App grantee:

```ts
export const ORDERBOOK_AUTHZ_MSG_TYPES = [
  '/injective.exchange.v1beta1.MsgCreateDerivativeMarketOrder',
  '/injective.exchange.v1beta1.MsgCreateDerivativeLimitOrder',
  '/injective.exchange.v1beta1.MsgCancelDerivativeOrder',
  '/injective.exchange.v1beta1.MsgBatchUpdateOrders',
  '/injective.exchange.v1beta1.MsgIncreasePositionMargin'
]

export const APP_RFQ_AUTHZ_MSG_TYPES = [
  '/injective.wasmx.v1.MsgExecuteContractCompat'
]
```

RFQ contract:

```ts
export const RFQ_CONTRACT_AUTHZ_MSG_TYPES = [
  '/injective.exchange.v2.MsgPrivilegedExecuteContract',
  '/injective.exchange.v2.MsgBatchUpdateOrders',
  '/cosmos.bank.v1beta1.MsgSend'
]
```

## Gasless Grant Broadcast

Broadcast grant and revoke transactions through `IndexerGrpcWeb3GwApi` so the
connected wallet only signs typed data and the gateway fee payer covers gas.

```ts
import { grantAuthzWithFeePayer } from './rfq/authz'

const session = await grantAuthzWithFeePayer({
  granter: injAddress,
  ethAddress,
  onProgress: setStatus
})
```

Under the hood:

1. Convert every SDK message with `msg.toWeb3Gw()`.
2. Call `prepareExchangeTxRequest` with `chainId: 1776` and the user's EVM
   address. This `chainId` is the Web3Gateway EIP-712 / Injective EVM chain
   ID, not the RFQ quote `chainId` string (`injective-1`).
3. Ask the wallet to sign `prepared.data` via `eth_signTypedData_v4`.
4. Call `broadcastTxRequest` with the wallet signature, original Web3Gateway
   messages, and prepared response.
5. Poll `TxGrpcApi.fetchTxPoll` for block inclusion. `broadcastTxRequest`
   returns when the gateway has the tx in its mempool, not when it lands on
   chain. The shipped helper polls by default; pass `pollForInclusion: false`
   if your UI handles confirmation separately.

Do not rebuild the prepared payload. It contains the fee-payer fields needed
for a gasless setup transaction.

## No-INJ Guarantee

The user wallet only ever signs three things, none of which require an INJ
balance:

| Signing event | What user signs | Who pays gas |
|---|---|---|
| Grant AuthZ | EIP-712 typed data via Web3Gateway | Web3Gateway fee payer |
| Revoke AuthZ | EIP-712 typed data via Web3Gateway | Web3Gateway fee payer |
| TP/SL intent | EIP-712 `SignedTakerIntent` (off-chain) | n/a, submitted to indexer |

RFQ open/close is signed by the local autosign grantee key (not the user
wallet) and the RFQ gateway covers gas through its own fee payer. Any other
one-off user setup transaction (e.g. profile registration) should route through
`broadcastUserMsgsViaWeb3Gateway` so the user wallet still never needs INJ.

## Storage

Store:

```ts
type AutosignSession = {
  granterAddress: string
  granteeAddress: string
  ethAddress: string
  privateKeyHex: string
  evmChainId: number
  expiration: number
  scopeVersion: number
}
```

Use `scopeVersion` so old sessions can be forced to re-authorize when new RFQ
permissions are added.

## Revocation

Revocation should:

1. Broadcast `MsgRevoke` for the current grant scope through the same
   Web3Gateway fee-payer path.
2. Clear local storage even if UI refresh fails after broadcast.
3. Reset active session state.

If a wallet changes, never reuse the previous wallet's grantee key.
