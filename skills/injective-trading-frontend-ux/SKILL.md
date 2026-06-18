---
name: injective-trading-frontend-ux
description: Build, review, or debug Injective trading frontend UX for RFQ, orderbook, AuthZ/autosign, wallet-connected trading, USDC balances, trade buttons, search, and user-facing error states. Use this whenever implementing or reviewing a browser trading app on Injective, especially if the UI opens or closes positions, cashes out, uses max leverage, uses RFQ/AuthZ/autosign, displays USDC balances, or handles transaction failures.
license: MIT
metadata:
  author: ckhbtc
  version: "1.0.0"
---

# Injective Trading Frontend UX

Use this skill when building or reviewing a browser UI that lets users trade on
Injective. Pair it with protocol-specific skills such as
`injective-frontend-wallet`, `injective-rfq-integrations`,
`injective-trading-autosign`, and `injective-usdc-integration` when the task
touches those areas.

## Core Rule

A trading UI should keep the protocol precise in code and logs, but keep the
user flow simple, conservative, and impossible to double-submit accidentally.

## Pre-Ship Checklist

### Trade Submission

- Use one in-flight trade lock per active wallet/session for all
  transaction-producing actions: open, close, cash out, cash out all, cancel,
  and emergency exits.
- Disable every trade button while the lock is held. Release only after the tx
  is confirmed or the flow fails.
- Do not rely on a per-card spinner or per-position loading state to prevent
  duplicate broadcasts. Two buttons can still race the same account sequence.
- Treat `account sequence mismatch` as a likely frontend concurrency or
  stale-sequence bug before changing chain parameters.
- Keep bulk close/cash-out flows sequential unless the signer and sequence
  manager are proven safe for parallel transactions.

### Wallet, AuthZ, And Autosign Readiness

- Distinguish wallet connection from trading readiness. Connected wallet does
  not imply RFQ/AuthZ/autosign is ready.
- Revalidate local session, grantee, or autosign state against the currently
  connected `inj1` address after connect, account swap, reload, and revoke.
- Key local grantee/session storage by granter address. Never let a session from
  wallet A appear active for wallet B.
- For revoke flows, broadcast and confirm the on-chain `MsgRevoke` before
  clearing local session state. If revoke fails or the user rejects signing,
  keep the session visible so they can retry.
- Show actionable states such as `Authorize wallet`, `Order pending`, or
  `Order failed, please try again.` Avoid leaking raw message type or signer
  internals in the primary UI.

### RFQ And Order Errors

- Do not expose RFQ IDs, taker addresses, CheckTx logs, account sequence
  numbers, or raw tx hashes as the main error copy.
- Normalize RFQ no-quote timeouts like
  `no quotes received within wait time [rfqID: ... taker: ...]` to a generic
  failure message. Log the details for developers.
- Prequote or warmup requests are useful for speed, but final click-time
  submission still needs quote freshness, slippage, maker allowlist, and
  prepared-input validation.
- A matched RFQ is not the same as a confirmed trade. Keep controls locked until
  settlement is confirmed or failed.

### USDC And Amount Inputs

- Default cash/trade amount fields blank. Do not prefill `$100` or any fixed
  amount; many wallets have less.
- Let explicit controls such as Half and All-In fill from the current visible
  balance.
- Truncate displayed USDC balances instead of rounding up, so the UI never
  implies spendable funds that may not exist.
- After a bridge/CCTP/funding tx, a short-lived local balance floor can make the
  UI less confusing while indexer balances catch up. Clear it once the
  authoritative balance catches up or the floor expires.
- Keep native USDC denoms explicit in code and logs. Injective EVM USDC is
  `0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`; Cosmos bank denom is
  `erc20:0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`.

### Market Search And Layout

- Prefer search that scrolls to and highlights matching markets while keeping
  the full market grid rendered.
- Avoid filtering to a single result if the grid layout stretches one card
  across the page.
- Use stable card/grid dimensions so search, loading labels, error stamps, and
  button states do not reshape the trading form.
- If search has no match, keep the grid stable and show a compact no-match
  state near the search control or below the grid.

### Copy Boundaries

- User copy should describe what the user can do next, not how the protocol
  failed internally.
- Developer logs can include RFQ ID, taker address, tx hash, rawLog, account
  number/sequence, and prepared quote diagnostics.
- Primary UI copy should stay short: `Enter cash`, `Need cash`,
  `Order pending`, `Order failed, please try again.`, `Authorize wallet`.

## Good Defaults

- Blank amount input with `Enter cash` CTA disabled.
- Half / All-In buttons disabled until a positive USDC balance is known.
- Global trade lock shared by open and close buttons.
- Search shortcut `/` focuses search; results scroll and highlight rather than
  filtering away context.
- Toasts and per-card errors use sanitized messages; raw errors go to console or
  telemetry.

## When To Use Other Skills

- Wallet signing, Injective pubkey types, sequence, and browser wallet errors:
  use `injective-frontend-wallet`.
- RFQ taker implementation details: use `injective-rfq-integrations`.
- AuthZ/autosign grants and session trading: use `injective-trading-autosign`.
- CCTP/native USDC bridge flows: use `injective-usdc-integration`.
