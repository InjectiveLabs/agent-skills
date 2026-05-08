# Circle CCTP V2 — chain reference

These are the values the CLI's `chains.mjs` is built from. Source of truth: [developers.circle.com/cctp/cctp-supported-blockchains](https://developers.circle.com/cctp/cctp-supported-blockchains).

## V2 contract addresses

Deterministic — same address on every V2-enabled EVM chain.

| Contract | Address |
|---|---|
| `TokenMessengerV2` | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| `MessageTransmitterV2` | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |
| `TokenMinterV2` | `0xfd78EE919681417d192449715b2594ab58f5D002` |
| `MessageV2` | `0xec546b6B005471ECf012e5aF77FBeC07e0FD8f78` |

## Per-chain values used by this skill

| Chain | EVM chain id | CCTP domain | Native USDC |
|---|---:|---:|---|
| Ethereum | 1 | 0 | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Avalanche | 43114 | 1 | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |
| OP Mainnet | 10 | 2 | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| Arbitrum One | 42161 | 3 | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Base | 8453 | 6 | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Polygon | 137 | 7 | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| **Injective EVM** | **1776** | **29** | **`0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`** |

## Capabilities (per Circle's matrix)

| Chain | Standard transfer | Fast transfer | Forwarding |
|---|---|---|---|
| Ethereum, Avalanche, OP, Arbitrum, Base, Polygon | ✓ | ✓ | ✓ |
| Injective EVM | ✓ | — | — |

This skill only uses **standard transfer** so Fast/Forwarding are out of scope. Adding Fast for non-Injective routes is a small change in `cctp.mjs` (lower `minFinalityThreshold`, non-zero `maxFee`, plus a fee fetch from Circle's `/v2/burn/USDC/fees/{src}/{dst}` endpoint).

## Adding a new chain

When Circle enables a new V2 chain, add an entry to `chains.mjs`:

```js
chainKey: {
  id: <evm chain id>,
  domain: <circle domain id>,
  name: '<display name>',
  rpcs: ['https://...', '...'],   // publicnode.com first if available
  explorer: 'https://...',
  nativeCurrency: { name, symbol, decimals: 18 },
  usdc: '<native USDC contract>',
  cctp: CCTP_V2,                  // always — V2 contracts are deterministic
  finalityHint: '~N min',
}
```

No code changes needed beyond that — the CLI and renderers are chain-agnostic over `CHAINS`.

## Why chain ID ≠ domain ID

Circle's CCTP domains pre-date most L2s and use a separate, smaller integer space (currently 0-29). They have no relationship to EIP-155 chain IDs. The CLI never confuses them because each chain entry stores both fields explicitly — `id` is for viem's chain config (and EIP-712 signing), `domain` is for `depositForBurn`'s `destinationDomain` arg.
