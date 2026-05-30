# Troubleshooting

## `signature missing`

You probably tried to settle a stream object that is not an executable signed
maker quote. Use gateway prepare autosign for settlement, or require all manual
quote filters to pass before building an accept message.

## `No executable RFQ quote returned`

Log:

- raw quote count
- first rejection reason
- quote RFQ id
- ACK RFQ id
- contract address
- signature presence
- price vs worst price

Quotes can arrive before ACK. Do not assume no ACK means no usable quote.

## `not in canonical decimal form`

Every decimal field must be plain notation without unnecessary trailing zeros.
Do not use JS floating point formatting for signed fields.

## `authorization not found`

Check both grant groups:

- app grantee messages
- RFQ contract grantee messages

Old sessions may need a scope bump and re-authorization.

## Wallet asks user to pay setup gas

The setup transaction is bypassing Web3Gateway fee payer. AuthZ grant/revoke
should use:

- `msg.toWeb3Gw()` for every SDK message
- `IndexerGrpcWeb3GwApi.prepareExchangeTxRequest`
- `eth_signTypedData_v4` over the returned `prepared.data`
- `IndexerGrpcWeb3GwApi.broadcastTxRequest`

Do not use direct `TxGrpcApi.broadcast` for wallet-signed setup transactions
unless the product intentionally requires users to pay gas.

## `Web3Gateway fee payer is unavailable`

Call `fetchFeePayer()` during startup or before the grant flow. If no fee payer
or pubkey is returned, disable gasless setup and surface a clear status instead
of sending users into a failing signature flow.

## `fee payer signature invalid`

The gateway returned a fee-payer signature that could not be decoded as hex.
Reject the settlement and log the gateway response shape.

## `signature verification failed`

For prepared autosign transactions:

- decode `AuthInfo`
- identify signer indices by normalized public key
- handle protobuf-wrapped `Any.value` pubkeys (`0a21...raw-key`)
- do not assume autosign signer index `0`
- sign the returned `bodyBytes` and `authInfoBytes`
- insert autosign and fee-payer signatures in the decoded signer order

Do not rebuild the transaction.

This exact production symptom was seen as:

```text
broadcast error on transaction validation: tx ... is invalid: code=4,
log='signature verification failed; please verify account number (...) and chain-id (injective-1): ... unauthorized'
```

The fix was signer-slot matching, not quote routing.

## Conditional TP/SL does not trigger

Check:

- order status is `pending_trigger`
- trigger type matches position side
- trigger price is canonical
- deadline has not expired
- lane state is current
- wallet signed on Injective EVM chain id `1776`, while RFQ wire
  `chainId` / Cosmos sign docs still use `injective-1`

## Conditional TP/SL fails after edit

You likely signed with stale `lane_version`. After `cancel_intent_lane`, query
the RFQ contract again and sign with the new lane counters.
