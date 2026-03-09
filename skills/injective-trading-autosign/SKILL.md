---
name: injective-trading-autosign
description: Set up AuthZ delegation on Injective for session-based auto-trading. Grants a scoped, time-limited permission to an ephemeral key so the AI can place and close perpetual trades without a wallet popup or password prompt for every order. Use authz_grant to enable, authz_revoke to disable. Requires the Injective MCP server to be connected.
uses: ["injective-mcp-servers"]
license: MIT
metadata:
  author: ckhbtc
  version: "0.0.0"
---

## Injective Trading Autosign, Skill Guide

AuthZ delegation lets a user grant a scoped, on-chain permission to a secondary key (the "grantee") to execute specific message types on their behalf.
This enables session-based trading without password prompts per trade.

**Security model**: The grant is scoped to specific Cosmos message types (trading only - no withdrawals or transfers).
It expires automatically. The user can revoke at any time.

## When to apply

- TODO

Sample prompts: `./references/sample-prompts.md`

## Important

### Safe Message Types for Trading

**Only grant** these types - they cover all perpetual trading operations:

| Message Type | What it allows |
|---|---|
| `MsgCreateDerivativeMarketOrder` | Open/close positions via market order |
| `MsgCreateDerivativeLimitOrder` | Place limit orders |
| `MsgCancelDerivativeOrder` | Cancel limit orders |
| `MsgBatchUpdateOrders` | Batch order operations |
| `MsgIncreasePositionMargin` | Add margin to existing position |

**Never grant** `MsgSend`, `MsgWithdraw`, governance messages, or any transfer-related types.

## Notes

- AuthZ is an on-chain Cosmos SDK primitive - the grant is recorded on Injective and verifiable by anyone.
- The granter pays gas for the grant and revoke transactions. The grantee pays gas for authorized transactions.
- Injective's fee delegation (if enabled) can cover grantee gas, enabling fully gasless session trading.
- Expiry is in seconds from time of grant. 86400 = 24h, 259200 = 72h.
- If the grantee key is compromised, revoke immediately - the grant is limited to trading actions only, not withdrawals.

## Browser-Based AutoSign (MetaMask + EIP-712)

When implementing AutoSign in a browser frontend (e.g. `autosign.ts` with `enableAutoSign`):

evmChainId must come from MetaMask at grant time.
The `evmChainId` stored in the AutoSign state must be the **actual MetaMask chain at the moment the grant tx is signed**, NOT a hardcoded value:

Correct - read from MetaMask:
```js
const evmChainId = parseInt(
  await window.ethereum.request({ method: 'eth_chainId' }), 16
);
```

Wrong - hardcoding bypasses MetaMask's chain enforcement:
```js
const evmChainId = 1776;
```

## Activities

## Grant AuthZ Permission

```
authz_grant
  granterAddress: inj1...     ← your main wallet
  password: ****              ← keystore password (one-time, for signing the grant tx)
  granteeAddress: inj1...     ← ephemeral/session key to grant permission to
  msgTypes:                   ← list of allowed message types
    - MsgCreateDerivativeMarketOrder
    - MsgCreateDerivativeLimitOrder
    - MsgCancelDerivativeOrder
    - MsgBatchUpdateOrders
    - MsgIncreasePositionMargin
  expirySeconds: 86400        ← optional, default 86400 (24h). Max recommended: 259200 (72h)
```

After this one transaction, the grantee can trade on behalf of the granter for the duration.

## Revoke AuthZ Permission

```
authz_revoke
  granterAddress: inj1...
  password: ****
  granteeAddress: inj1...
  msgTypes:
    - MsgCreateDerivativeMarketOrder
    - MsgCreateDerivativeLimitOrder
    - MsgCancelDerivativeOrder
    - MsgBatchUpdateOrders
    - MsgIncreasePositionMargin
```

Revoke immediately cancels all permissions for the specified message types.
Partial revocation (removing specific msg types) is supported.

## Workflow: One-Click Session Trading

1. User grants AuthZ to session key (one wallet confirmation)
2. AI uses session key to trade for duration of grant
3. Grant expires automatically OR user revokes manually

```
# Check existing grants on-chain (via Injective Indexer or explorer)
# injective.network → account → authz tab

# Grant (one-time per session)
authz_grant(granterAddress, password, granteeAddress, msgTypes, expirySeconds: 86400)

# Trade freely during session - no password needed if using grantee key
# ...

# Revoke when done
authz_revoke(granterAddress, password, granteeAddress, msgTypes)
```

### Valid chains for AutoSign grants

MetaMask must be on either of these networks when granting AutoSign:
- Ethereum (1)
- Injective EVM (1776)

The same `evmChainId` used during the grant transaction MUST be used for all subsequent `broadcastAutoSign` calls.

## Related skills

- `injective-mcp-servers`

If these skills are not available, selectively run the following commands to install them:

```shell
npx skills add InjectiveLabs/agent-skills --skill injective-mcp-servers
```

## Prerequisites

- Injective MCP server must be running
- User prompts should be issued from an AI tool that is configured to talk to the Injective MCP server
- Injective SDK
  - Pin to exactly `@injectivelabs/sdk-ts: 1.17.8`
  - Newer versions (1.18+) produce different EIP-712 typed data that Injective rejects
