---
name: injective-faucet
description: Create and operate an INJ faucet for initializing fresh Injective wallets. Sends a small amount of INJ via EVM to create on-chain accounts and provide gas for AuthZ grants. Handles the circular dependency where fresh wallets can't transact without gas but can't receive gas without an account. Pairs with injective-trading-autosign for zero-friction onboarding.
uses: ["injective-trading-autosign"]
license: MIT
metadata:
  author: ckhbtc
  version: "1.0.0"
  filePattern:
    - "**/faucet*"
    - "**/init-account*"
  bashPattern:
    - "faucet"
    - "init.*account"
---

## Injective Faucet Skill Guide

An INJ faucet solves the cold-start problem for fresh Injective wallets: they can't broadcast transactions (including AuthZ grants) without gas, but they can't get gas without someone sending them tokens first.

## When to Apply

- When onboarding fresh wallets that have never transacted on Injective
- When a user gets `account not found` or `insufficient funds` errors during AuthZ grant
- When building a product where users should not need to acquire INJ before using it
- When you need to initialize on-chain accounts programmatically

## The Problem

On Injective (and all Cosmos chains), a wallet address exists mathematically but doesn't have an on-chain account until it receives its first transaction. Even after receiving tokens, the account's public key isn't registered until it sends its first outgoing transaction.

This creates two barriers for fresh wallets:
1. **No account**: Can't broadcast any transaction (including AuthZ grants)
2. **No gas**: Even after account creation, the wallet needs INJ to pay transaction fees

## Solution Architecture

### 1. Faucet Wallet Setup

Generate a dedicated faucet wallet and fund it with INJ:

```typescript
import { ethers } from 'ethers'
import { Address } from '@injectivelabs/sdk-ts'

// Generate faucet wallet
const wallet = ethers.Wallet.createRandom()
console.log('Private key:', wallet.privateKey)
console.log('ETH address:', wallet.address)
console.log('INJ address:', Address.fromHex(wallet.address).toBech32())
```

**Important**: The faucet wallet must send at least one outgoing transaction to register its public key on-chain before it can be used programmatically. Send a small self-transfer or transfer to any address via the Injective EVM RPC to initialize it.

### 2. Initialize Faucet On-Chain

The faucet wallet itself needs initialization. Use ethers.js with the Injective EVM RPC:

```typescript
const provider = new ethers.JsonRpcProvider('https://sentry.evm-rpc.injective.network/')
const faucetWallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider)

// Send a self-transfer to register pubkey (one-time)
const tx = await faucetWallet.sendTransaction({
  to: ADMIN_WALLET_ETH_ADDRESS,
  value: ethers.parseEther('0.1'),
  type: 0, // Legacy tx — Injective EVM doesn't support EIP-1559
  gasLimit: 21000,
  gasPrice: ethers.parseUnits('500', 'gwei'),
})
await tx.wait()
```

### 3. Faucet Implementation

```typescript
import { ethers } from 'ethers'
import { Address } from '@injectivelabs/sdk-ts'

const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY ?? ''
const INJ_EVM_RPC = 'https://sentry.evm-rpc.injective.network/'
const MIN_BALANCE = ethers.parseEther('0.001') // 0.001 INJ

export async function initAccount(wallet: string): Promise<string> {
  const ethAddress = Address.fromBech32(wallet).toHex()
  const provider = new ethers.JsonRpcProvider(INJ_EVM_RPC)
  const faucetWallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider)

  // Check current balance — only send if below threshold
  const balance = await provider.getBalance(ethAddress)
  if (balance >= MIN_BALANCE) return 'already_funded'

  // Top up to MIN_BALANCE
  const topUp = MIN_BALANCE - balance
  const tx = await faucetWallet.sendTransaction({
    to: ethAddress,
    value: topUp,
    type: 0,
    gasLimit: 21000,
    gasPrice: ethers.parseUnits('500', 'gwei'),
  })
  const receipt = await tx.wait()
  if (!receipt || receipt.status !== 1) throw new Error('Faucet tx failed')
  return tx.hash
}
```

### 4. Public Key Recovery for Fresh Accounts

Fresh accounts have no on-chain public key. The AuthZ grant will fail with `invalid secp256k1 public key` if you use a placeholder. Recover the real pubkey from a `personal_sign` signature:

```typescript
import { ethers } from 'ethers'

async function recoverPubKeyFromWallet(ethAddress: string): Promise<string> {
  const msg = `Injective account verification: ${ethAddress}`
  const sig = await window.ethereum.request({
    method: 'personal_sign',
    params: [msg, ethAddress],
  })
  const msgHash = ethers.hashMessage(msg)
  const uncompressed = ethers.SigningKey.recoverPublicKey(msgHash, sig)
  const compressed = ethers.SigningKey.computePublicKey(uncompressed, true)
  const bytes = ethers.getBytes(compressed)
  return btoa(String.fromCharCode(...bytes)) // base64 for Cosmos tx
}
```

Use this recovered pubkey in `createTransaction` instead of a zero-byte placeholder.

## Critical Notes

### Use EVM RPC, NOT Cosmos SDK for Faucet Sends

The Injective SDK's `MsgBroadcasterWithPk.broadcast()` fails for fresh faucet wallets with `invalid secp256k1 public key`. This is because the Cosmos ante handler panics when the pubkey isn't registered. **Always use ethers.js + Injective EVM RPC** (`https://sentry.evm-rpc.injective.network/`) for faucet operations.

### Legacy Transaction Type Required

Injective EVM does not support EIP-1559 transactions. Always use `type: 0` (legacy) with explicit `gasPrice`.

### inEVM is Deprecated

Do NOT use `mainnet.rpc.inevm.com`. Use `sentry.evm-rpc.injective.network/` (Injective EVM, chain ID 1776).

### Do NOT Wait for Transaction Receipt

`eth_getTransactionReceipt` is unreliable on the Injective EVM RPC (returns internal errors). Fire-and-forget — send the tx and return the hash immediately. The client should wait 5 seconds before retrying the AuthZ grant.

```typescript
// DON'T do this — unreliable on Injective EVM
const receipt = await tx.wait() // ❌ Throws "Internal error: unexpected end of JSON input"

// DO this — fire and forget
logger.info({ txHash: tx.hash }, 'Faucet: top-up sent')
return tx.hash // ✅ Client waits 5s then retries
```

### Catch Both Error Patterns

The client must trigger the faucet on BOTH of these error messages:
- `account not found` — wallet has never received any tokens
- `insufficient funds` — wallet exists but has no gas for the AuthZ tx

```typescript
const needsFaucet = msg.includes('not found') && msg.includes('account')
  || msg.includes('insufficient funds')
```

### Use Cooldown, NOT Permanent Blocklist

Use a time-based cooldown (1 minute), NOT a permanent `Set`. A permanent blocklist means if the faucet sends too little (e.g., 1 wei), the wallet can never get topped up without a server restart.

```typescript
// Bad — permanent blocklist, can't retry
const _initialized = new Set<string>()
if (_initialized.has(wallet)) throw new Error('Already initialized') // ❌

// Good — time-based cooldown, allows retries
const _recentInits = new Map<string, number>()
if (Date.now() - (_recentInits.get(wallet) ?? 0) < 60_000) throw new Error('Wait') // ✅
```

### Rate Limiting

Protect the faucet from abuse:
- Per-wallet cooldown (1 minute between attempts)
- Per-IP rate limiting on the endpoint
- Balance check before sending (skip if already funded)

### Cost Math

| Faucet Amount | Cost per User | Users per 1 INJ | Users per 10 INJ |
|---|---|---|---|
| 0.001 INJ | ~$0.003 | 1,000 | 10,000 |
| 0.01 INJ | ~$0.03 | 100 | 1,000 |

Gas cost per faucet send: ~0.0000105 INJ (500 gwei × 21,000 gas limit).

## Integration with AuthZ Flow

The faucet + AuthZ flow for a completely fresh wallet:

1. User connects wallet → JWT authentication (personal_sign)
2. AuthZ grant attempted → fails with `account not found` or `insufficient funds`
3. **Faucet auto-triggers** → checks balance → tops up to 0.001 INJ
4. Wait 5 seconds for chain confirmation
5. **Pubkey recovery** → `personal_sign` → recover compressed secp256k1 key
6. AuthZ grant retried with real pubkey → succeeds
7. User is on the dashboard with zero manual steps

The user sees: Connect → 3 wallet popups (JWT sign, pubkey verify, AuthZ grant) → Dashboard. Zero friction, zero manual token acquisition.

## Environment Variables

```bash
# Faucet wallet private key (hex, no 0x prefix)
FAUCET_PRIVATE_KEY=abc123...

# Optional: override RPC
INJ_EVM_RPC=https://sentry.evm-rpc.injective.network/
```

## Error Patterns

| Error | Cause | Fix |
|---|---|---|
| `account not found` | Wallet never received any tokens | Send INJ via faucet |
| `insufficient funds` | Wallet exists but has no gas | Top up via faucet |
| `invalid secp256k1 public key` | Pubkey not registered on-chain | Use `personal_sign` recovery |
| `tx timeout height` | Block height cached/stale | Use `cache: 'no-store'` + `_=${Date.now()}` bust |
| Faucet's own `invalid secp256k1` | Faucet wallet not initialized | Send manual EVM tx from faucet first |
