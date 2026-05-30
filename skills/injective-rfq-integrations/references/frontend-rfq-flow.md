# Frontend RFQ Flow

## Setup Transactions

Use `IndexerGrpcWeb3GwApi.prepareExchangeTxRequest` and
`broadcastTxRequest` for wallet-signed setup transactions such as AuthZ grant
and revoke. That path includes the gateway fee-payer fields, so the user only
signs EIP-712 typed data and does not need an INJ balance for gas.

## Recommended Path: Gateway Prepare Autosign

Use `IndexerGrpcRfqGwApi.fetchPrepareAutoSign` for production browser apps.

The request includes:

- `cid`
- `clientId`
- `marketId`
- `direction`
- `margin`
- `quantity`
- `worstPrice`
- `takerAddress`
- `autosignAddress`
- `autosignPubKey`
- optional autosign account number and sequence
- `quotesWaitTimeMs`

Set `quotesWaitTimeMs` to `500`.

The gateway does the short quote collection window and returns an executable
transaction. The browser should not settle arbitrary prequotes.

## Prepared Tx Signing Rules

The gateway response contains a partially signed `TxRaw`. Treat it as immutable
except for the `signatures` array:

- sign the returned `bodyBytes` and `authInfoBytes`
- use `prepared.autosignAccountNumber` in the sign doc
- use Cosmos chain id `injective-1` in the Cosmos sign doc
- decode `AuthInfo.signerInfos`
- match signer indexes by normalized pubkey
- insert autosign and fee-payer signatures in decoded signer order

Do not assume signer index order. A real production failure happened when the
fee payer signer appeared before the autosign signer and the browser filled the
wrong signature slots.

Normalize pubkeys before comparing. Signer info values may be protobuf
`Any.value` bytes (`0a21...`) while local keys are raw 33-byte compressed
pubkeys.

## Manual TakerStream Path

Use manual TakerStream only if you need to inspect raw ACK and quote behavior.

Rules:

- WebSocket path is `/injective_rfq_rpc.InjectiveRfqRPC/TakerStream`.
- Subprotocol is `grpc-ws`.
- Send pings every second.
- The RFQ request has a `client_id`; this is not always the final RFQ id.
- A quote can arrive before `request_ack`.
- Start the collection window on ACK or first matching quote.
- Collect for 500 ms.
- If the ACK id is zero or mismatched, fall back to quote RFQ ids.

Quote filters:

- signature exists
- maker exists
- `quote.chainId` is the Cosmos chain ID `injective-1` (not EVM `1776`)
- `quote.evmChainId`, when present, is the EIP-712 chain ID `1776`
- contract is the RFQ contract
- market id matches
- RFQ id matches selected candidate
- direction matches
- quote price is inside worst price
- expiry is not too close

For longs, lower quote price is better. For shorts, higher quote price is
better.

## Gateway vs Manual Stream

Prefer gateway prepare because it returns the settlement transaction and fee
payer signature. Manual stream is useful for diagnostics and special routing,
but requires more contract-specific accept logic.

If you see an unsigned quote in the stream, do not try to settle it. Treat it
as diagnostic data unless it passes all execution checks.
