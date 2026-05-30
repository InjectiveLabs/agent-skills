# Conditional TP/SL

RFQ TP/SL is a signed RFQ close intent. It is not an orderbook reduce-only
limit order.

## Trigger Matrix

| Position | TP trigger | SL trigger | Close direction |
|---|---|---|---|
| Long | `mark_price_gte` | `mark_price_lte` | `short` |
| Short | `mark_price_lte` | `mark_price_gte` | `long` |

Every TP/SL conditional order must use `margin: "0"`.

## Defaults

```ts
export const RFQ_TPSL_SIGNED_INTENT_VERSION = 1
export const RFQ_TPSL_SUBACCOUNT_NONCE = 0
export const RFQ_TPSL_DEADLINE_MS = 21 * 24 * 60 * 60 * 1000
export const RFQ_TPSL_NONCE_WINDOW_MS = 60_000
export const RFQ_TPSL_SLIPPAGE = 0.005
export const RFQ_TPSL_MIN_FILL_RATIO = 0.1
```

## Replay Counters

Fetch lane state before signing:

```json
{
  "taker_intent_state": {
    "taker": "inj1...",
    "market_id": "0x...",
    "subaccount_nonce": 0
  }
}
```

Use the returned `epoch` and `lane_version` in the EIP-712 message and the
submitted conditional order.

## Edit And Cancel

To edit TP/SL:

1. If any pending conditional order exists for the market, broadcast
   `cancel_intent_lane` through a gasless broadcaster.
2. Re-query lane state.
3. Re-sign any TP/SL that should remain active.
4. Submit each fresh signed intent.

Canceling only TP or only SL still invalidates the whole lane. Preserve the
other side by re-signing it after the lane cancel.

The cancel transaction is a normal contract execute message. It can use the
same Web3Gateway fee-payer path as AuthZ setup if you want the user wallet to
sign it directly, or an AuthZ grantee broadcaster that itself uses fee
delegation.

## Reduce-Only Close Cleanup

After a manual reduce-only close, cancel the lane for that market. Otherwise a
stale TP/SL intent could trigger against a later position in the same market.
