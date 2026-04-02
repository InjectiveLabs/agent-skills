---
name: injective-trading-autosign
description: Set up AuthZ delegation on Injective for session-based auto-trading. Grants a scoped, time-limited permission to an ephemeral key so the AI can place and close perpetual trades without a wallet popup or password prompt for every order. Use authz_grant to enable, authz_revoke to disable. Requires the Injective MCP server to be connected.
uses: ["injective-mcp-servers", "injective-faucet"]
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

- When you wish to give another account permission to execute transactions on behalf of your account
- When you wish to revoke this permission
- When you wish to granularly limit the scope of these permission to specific transaction types

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

## Browser-Based AutoSign (MetaMask, Rabby, Keplr + EIP-712)

When implementing AutoSign in a browser frontend (e.g. `autosign.ts` with `enableAutoSign`):

### evmChainId — Read from Wallet, Never Hardcode

The `evmChainId` stored in the AutoSign state must be the **actual wallet chain at the moment the grant tx is signed**, NOT a hardcoded value:

```js
// Correct — read from wallet
const evmChainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
// Wrong — hardcoding bypasses wallet chain enforcement
const evmChainId = 1776;
```

### Wallet Compatibility

**Wallet connection**: Use `eth_requestAccounts` (respects default wallet provider). Do NOT use `wallet_requestPermissions` — it forces MetaMask even when Rabby is the default.

```js
// Good — respects Rabby, MetaMask, or whatever is default
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
// Bad — forces MetaMask account picker, ignores Rabby
await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
```

**Disconnect**: Use `wallet_revokePermissions` to clear cached accounts so next connect shows the wallet picker:
```js
await window.ethereum?.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
```

### Chain Switching (Rabby + MetaMask Compatible)

Rabby throws different error codes than MetaMask on `wallet_switchEthereumChain`. Handle gracefully:

```js
try {
  await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x6f0' }] });
} catch {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x6f0',
        chainName: 'Injective',
        nativeCurrency: { name: 'Injective', symbol: 'INJ', decimals: 18 },
        rpcUrls: ['https://sentry.evm-rpc.injective.network/'],
        blockExplorerUrls: ['https://blockscout.injective.network'],
      }],
    });
  } catch { /* Rabby may reject but still be on the right chain */ }
}
// Always re-check — don't trust the switch/add result
const recheckChain = await window.ethereum.request({ method: 'eth_chainId' });
if (parseInt(recheckChain, 16) !== 1776) throw new Error('Switch to Injective (chain ID 1776)');
```

**IMPORTANT**: inEVM is DEPRECATED. Use `sentry.evm-rpc.injective.network/` (NOT `mainnet.rpc.inevm.com`). Block explorer: `blockscout.injective.network`.

### Public Key Recovery for Fresh Accounts

Fresh accounts have no on-chain public key. Using a zero-byte placeholder causes the chain to panic with `invalid secp256k1 public key`. Recover the real pubkey via `personal_sign`:

```typescript
import { ethers } from 'ethers'

async function recoverPubKeyFromWallet(ethAddress: string): Promise<string> {
  const msg = `Injective account verification: ${ethAddress}`
  const sig = await window.ethereum.request({ method: 'personal_sign', params: [msg, ethAddress] });
  const msgHash = ethers.hashMessage(msg)
  const uncompressed = ethers.SigningKey.recoverPublicKey(msgHash, sig)
  const compressed = ethers.SigningKey.computePublicKey(uncompressed, true)
  return btoa(String.fromCharCode(...ethers.getBytes(compressed)))
}

// In createTransaction:
const pubKey = onChainPubKey || await recoverPubKeyFromWallet(ethAddress)
```

### Block Height Caching Bug

`ChainRestTendermintApi.fetchLatestBlock()` gets cached by browsers. Use raw fetch with cache-bust:

```js
const blockRes = await fetch(
  `${endpoints.rest}/cosmos/base/tendermint/v1beta1/blocks/latest?_=${Date.now()}`,
  { cache: 'no-store' }
).then(r => r.json());
const timeoutHeight = parseInt(blockRes.block.header.height, 10) + 200; // +200 blocks, not +20
```

**+20 blocks is too tight** — with faucet delays, chain switching, and wallet popups, use +200 minimum (~3 minutes of runway).

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
