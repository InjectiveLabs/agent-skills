---
name: cygnus-perp-dex
description: >-
  Read from and write to the Cosmowarp perpetual futures market contracts on
  Injective testnet. Use this skill when the user asks to query perp contract
  metadata, open or manage leveraged positions, read pool/delta-neutrality
  state, work with limit orders, or build frontend integrations for the
  CygnusX perpetual DEX.
license: MIT
metadata:
  author: cygnus
  version: "1.0.0"
---

# CygnusX Perpetual DEX

Use this skill when interacting with the Cosmowarp perpetual futures contracts.
The deployment lives on the Injective testnet (`injective-888`) and exposes
CosmWasm smart-query and execute interfaces for leverage trading.
UI can be found at cygnusdex.vercel.app

## Deployed contracts

All markets are instantiated from **code id 39749** on the Injective testnet.

| Market | Contract address |
| --- | --- |
| BTC/USD | `inj14tx3a05zz8ag74sanv0d0cmwmjrenqvtxsxetf` |
| ETH/USD | `inj1tcw809m0v0j6dcaj6dapgx88pnk5uzh304gdfx` |
| SOL/USD | `inj1gl2cdgmezfuqkqn24jp3fuz3lf4dpdzkvefghh` |
| INJ/USD | `inj1lq982zx5ajmcqmdf7edd93rxq8xk97qr9jjl9k` |
| ATOM/USD | `inj1rwtncgf094zwxwan5l25g6qrmld7xj2ewz8yf7` |

The default reference contract used in examples is the BTC/USD market:
`inj14tx3a05zz8ag74sanv0d0cmwmjrenqvtxsxetf`.

## Canonical testnet values

```ts
const REST = 'https://k8s.testnet.lcd.injective.network:443'
const CHAIN_ID = 'injective-888'
const PERP_QUOTE_DENOM = 'erc20:0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d'
const PERP_QUOTE_DECIMALS = 6
const PRICE_SCALE = 1_000_000_000_000
```

Collateral and quote amounts use **6 decimals**. Oracle and entry prices are
returned scaled by **10^12**. Leverage is passed as a decimal `string` (e.g.
`"10.00"`, `"50"`) and must be between `1.00` and the market's `max_leverage`.

## Smart query patterns

Every query is a JSON message, base64-encoded, and appended to the REST path:

```text
{REST}/cosmwasm/wasm/v1/contract/{CONTRACT}/smart/{base64_query_json}
```

### Metadata queries

- `config`: owner, collateral denom, market pair, max leverage, fees, funding
- `oracle_price`: current mark/index price (scaled by 10^12)
- `pool`: liquidity, shares, open notional, fee/funding reserves
- `delta_neutrality`: long/short open interest and skew

### Position queries

- `positions`: active positions for a trader
- `all_positions`: paginate every open position
- `closed_positions`: trader's historical closed positions
- `limit_orders`: trader's pending limit orders

### Single entity queries

- `position`: one open position by `position_id`

## Execute messages

Use `MsgExecuteContract` from `@injectivelabs/sdk-ts` or the `injectived` CLI.
All execute payloads are plain JSON objects (not base64). Attach collateral as
native funds for `open_position` and `adjust_position` when increasing notional.

- `open_position`: open a long or short with leverage
- `adjust_position`: change notional, leverage, or collateral
- `update_position`: update stop-loss, take-profit, trailing-stop only
- `close_position`: close one position by id
- `sweep_positions`: liquidate any liquidatable positions
- `clear_closed_positions`: remove the caller's closed-position history
- `execute_limit_order`: fill a pending limit order
- `cancel_limit_order`: cancel a pending limit order and refund collateral

## Message gotchas

- `side` is a string: `"long"` or `"short"`, not an object (long/short is case sensitive).
- `open_position` takes `limit_price` as a string or `null`. If it does not
  cross immediately, the collateral is held as a `PendingLimitOrder`.
- `update_position` does not change leverage or notional. Use
  `adjust_position` for size/collateral changes.
- `adjust_position` requires `simulate_adjust_position` before broadcasting if
  it changes notional or leverage (the preview returns the exact funds the
  trader must attach or receive).
- Use the contract's `config` to read `max_leverage` and fee rates.

## Quick command cheat sheet

```bash
CONTRACT=inj14tx3a05zz8ag74sanv0d0cmwmjrenqvtxsxetf
REST=https://k8s.testnet.lcd.injective.network:443

# metadata
curl -s "$REST/cosmwasm/wasm/v1/contract/$CONTRACT/smart/$(echo -n '{"config":{}}' | base64 -w0)" | jq .
curl -s "$REST/cosmwasm/wasm/v1/contract/$CONTRACT/smart/$(echo -n '{"oracle_price":{}}' | base64 -w0)" | jq .
curl -s "$REST/cosmwasm/wasm/v1/contract/$CONTRACT/smart/$(echo -n '{"pool":{}}' | base64 -w0)" | jq .

# positions
curl -s "$REST/cosmwasm/wasm/v1/contract/$CONTRACT/smart/$(echo -n '{"all_positions":{"limit":100}}' | base64 -w0)" | jq .

# change contract address and trader address as needed
TRADER=inj1...
curl -s "$REST/cosmwasm/wasm/v1/contract/$CONTRACT/smart/$(echo -n "{\"positions\":{\"trader\":\"$TRADER\"}}" | base64 -w0)" | jq .
curl -s "$REST/cosmwasm/wasm/v1/contract/$CONTRACT/smart/$(echo -n "{\"limit_orders\":{\"trader\":\"$TRADER\"}}" | base64 -w0)" | jq .
```

## Related skills

- `injective-trading-tokens`: token metadata, balances, sends, subaccounts
- `injective-frontend-wallet`: Keplr/MetaMask/Phantom connection on Injective
- `injective-trading-autosign`: AuthZ delegation for session-based trading
- `injective-usdc-integration`: native USDC collateral and CCTP flows
