---
name: injective-usdc-integration
description: >-
  Integrate native USDC on Injective into browser apps, trading apps, wallets,
  bridge widgets, and operational tooling. Use this skill whenever the user asks
  to add or migrate to native USDC on Injective, wire Circle CCTP V2 deposits or
  withdrawals, debug USDC balances or denoms, replace USDT or bridged USDC with
  native USDC, select USDC derivative markets, or build a CCTP bridge UI. Covers
  Injective EVM chain IDs, Cosmos bank denom mapping, CCTP domains and contract
  addresses, frontend wallet flow, attestation recovery, and production gotchas.
license: MIT
metadata:
  author: ck
  version: "1.0.0"
---

# Injective USDC Integration

Use this skill when adding **native USDC** support to an Injective app. Native
USDC on Injective is Circle-issued USDC exposed through Injective's MultiVM
Token Standard, so the same token can be used from EVM contracts and Cosmos
bank/exchange modules without a separate internal bridge.

## Start With The Surface

Identify which integration the user is asking for:

1. **Token metadata and balances**: add USDC constants, resolve the EVM token
   address to the Cosmos bank denom, display balances, and use 6 decimals.
2. **Trading or collateral**: prefer native USDC markets and denoms. Do not keep
   routing new perps through legacy USDT markets when USDC markets exist.
3. **Browser USDC app payments**: for deposits, credits, fees, or top-ups, use
   EIP-3009 `transferWithAuthorization` with an app gas relayer instead of a
   direct MetaMask ERC-20 transfer.
4. **CCTP bridge UI**: burn native USDC on a supported source chain, poll
   Circle's attestation API, then mint native USDC on Injective EVM.
5. **Withdrawals from Injective**: burn on Injective EVM, poll the attestation,
   then mint on the destination CCTP chain.
6. **Recovery or debugging**: if a CCTP burn confirmed but mint did not happen,
   re-fetch the message and attestation and submit `receiveMessage` again.

## Canonical Mainnet Values

Read [references/constants.md](./references/constants.md) before writing code.
The most common values are:

```ts
export const INJECTIVE_EVM_CHAIN_ID = 1776
export const INJECTIVE_COSMOS_CHAIN_ID = 'injective-1'
export const INJECTIVE_CCTP_DOMAIN = 29

export const INJECTIVE_USDC_EVM_ADDRESS =
  '0xa00C59fF5a080D2b954d0c75e46E22a0c371235a'

export const INJECTIVE_USDC_DENOM =
  `erc20:${INJECTIVE_USDC_EVM_ADDRESS.toLowerCase()}`

export const USDC_DECIMALS = 6
```

Important distinction:

- EVM calls use `0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`.
- Cosmos bank, exchange, and indexer flows use
  `erc20:0xa00c59ff5a080d2b954d0c75e46e22a0c371235a`.
- CCTP routes by Circle domain `29`, not EVM chain ID `1776`.

## Browser USDC Payments

For browser USDC deposits, credits, fees, or app top-ups on Injective EVM, avoid
asking MetaMask to submit a direct ERC-20 `USDC.transfer` from the user. Direct
transfers make the user pay native INJ gas and can trigger MetaMask's confusing
`Sending Unknown` / fee-warning screen.

Prefer Circle USDC's EIP-3009 authorization flow:

1. Build typed data for `TransferWithAuthorization`.
2. Ask the user to sign it with `eth_signTypedData_v4`.
3. Submit `transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s)`
   from an app-owned facilitator / gas relayer.
4. Credit the user only after the relayed transaction receipt confirms the USDC
   `Transfer` event.

Use this EIP-712 domain for native USDC on Injective EVM mainnet:

```ts
export const INJECTIVE_EVM_CHAIN_ID = 1776
export const NATIVE_USDC_INEVM = '0xa00C59fF5a080D2b954d0c75e46E22a0c371235a'

export const usdcAuthorizationDomain = {
  name: 'USDC',
  version: '2',
  chainId: INJECTIVE_EVM_CHAIN_ID,
  verifyingContract: NATIVE_USDC_INEVM,
} as const
```

Server-side relayer checks:

- `from` must match the authenticated user's EVM address.
- `to` must be the expected facilitator / treasury address.
- `validBefore` should be short, typically 10-20 minutes.
- `authorizationState(from, nonce)` must be false before relaying.
- `balanceOf(from)` must cover `value` before relaying.
- `verifyTypedData` or the recovered signer must equal `from`.
- The facilitator must keep enough native INJ on Injective EVM to pay relay
  gas. If relaying fails with `sender balance < tx cost`, top up the
  facilitator's `0x` address with INJ, not USDC.

This is not Web3Gateway. It is an app-operated relayer pattern for USDC
payments: users sign intent, the app submits the transaction and pays gas.

## CCTP V2 Flow

Read [references/cctp-v2.md](./references/cctp-v2.md) before implementing a
bridge. The standard browser flow is:

1. Validate the amount with decimal or bigint math.
2. Switch the wallet to the source EVM chain.
3. Approve `TokenMessengerV2` to spend the source chain's native USDC.
4. Call `TokenMessengerV2.depositForBurn(...)`.
5. Poll `https://iris-api.circle.com/v2/messages/{srcDomain}?transactionHash={burnTxHash}`.
6. Switch the wallet to Injective EVM.
7. Call `MessageTransmitterV2.receiveMessage(message, attestation)`.

Use standard transfer parameters for Injective:

```ts
const destinationCaller = '0x' + '0'.repeat(64)
const maxFee = 0n
const minFinalityThreshold = 2000
```

Injective is standard-transfer only in Circle CCTP. Do not assume Fast Transfer
is available on the Injective side.

## Frontend Rules

Read [references/frontend-integration.md](./references/frontend-integration.md)
when changing a browser app.

- Treat CCTP as a two-transaction user flow: burn on source, mint on
  destination. Show both tx hashes.
- The mint is permissionless. If the tab closes after burn, the user can resume
  from the burn hash.
- Make gas requirements explicit: source-chain gas for burn and INJ on
  Injective EVM for mint.
- Never pass bridged USDC variants like USDC.e or USDCnb as `burnToken`.
- Use `decimal.js`, `BigInt`, or an SDK parse-units helper for token math. Do
  not use floating point math for base-unit amounts.
- Keep CCTP source configs data-driven. Circle adds chains; product UI can
  choose a subset, but constants should not be scattered through components.

## Trading App USDC Balance UX

When CCTP or bridge funding feeds a trading frontend, make the balance display
conservative:

- Default trade amount inputs blank. Do not prefill `$100` or any fixed stake;
  many wallets have less, and a prefilled over-balance amount creates an
  avoidable `Need cash` state.
- Let explicit controls such as Half or All-In populate amounts from the
  current visible USDC balance.
- Truncate displayed USDC balances instead of rounding up, so the UI never
  implies spendable funds that may not exist after decimals, fees, or stale
  indexer data.
- After a bridge or CCTP mint, consider a short-lived local balance floor from
  the confirmed tx amount while indexer or LCD totals catch up. Clear the floor
  once the authoritative balance equals or exceeds it, or when it expires.
- Keep native USDC denoms explicit in code and logs. On Injective EVM the asset
  is `0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`; on Cosmos bank views it is
  `erc20:0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`.

## Common Migration Pattern

When moving an app from USDT or bridged USDC to native USDC:

1. Add native USDC token metadata and denom resolution first.
2. Update balance display and subaccount deposit/withdraw code to use the
   native denom.
3. Prefer active `/USDC` markets and reject inactive markets.
4. Update notional, margin, and fee labels from USDT to USDC.
5. Replace deBridge USDT onboarding with CCTP native USDC onboarding when the
   user is bridging USDC.
6. Add tests for denom resolution, decimal conversion, market filtering, and
   source-chain selection.

## Related Skills

- `injective-rfq-integrations`: RFQ trading flows once USDC collateral and
  markets are selected.
- `injective-trading-bridge`: deBridge DLN or Peggy for non-USDC assets and
  legacy bridge flows.
- `injective-trading-tokens`: token metadata, balances, sends, and subaccount
  movement through Injective tooling.
- `injective-evm-developer`: EVM contract and dApp work on Injective.

## Source Of Truth

Use public docs when updating constants:

- Injective USDC docs:
  `https://docs.injective.network/developers-defi/usdc-stablecoin`
- Circle CCTP EVM contract addresses:
  `https://developers.circle.com/cctp/references/contract-addresses`
- Circle USDC contract addresses:
  `https://developers.circle.com/stablecoins/usdc-contract-addresses`
- Circle supported chains and domains:
  `https://developers.circle.com/cctp/concepts/supported-chains-and-domains`
