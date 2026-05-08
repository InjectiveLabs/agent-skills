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

## Mainnet ↔ testnet share the same CCTP domain ID

> *"If a mainnet is listed, its official testnet is also supported. For example, Ethereum includes both Ethereum Mainnet and Ethereum Sepolia."* — [Circle docs](https://developers.circle.com/cctp/cctp-supported-blockchains)

Each network family has **one** CCTP domain id covering both its mainnet and testnet — the domain identifies the *chain family*, not the specific instance. The EVM chain id distinguishes mainnet from testnet at the JSON-RPC layer; the CCTP domain id is what `depositForBurn`'s `destinationDomain` arg uses to route the message. Concretely: Injective mainnet (chain id 1776) and Injective testnet (chain id 1439) both share **CCTP domain 29**. Same for Ethereum mainnet (1) and Sepolia (11155111) → both domain 0, etc.

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

## Why Injective doesn't need Fast Transfer

Circle's chain matrix lists Injective as **standard transfer only** — no Fast Transfer support. That's not a limitation; it's by design.

CCTP Fast Transfer exists to shortcut the wait for source-chain finality. On Ethereum, finality takes ~13 minutes (two epochs), so Fast Transfer with a small fee + bonded attesters is genuinely faster. But on a chain with sub-second blocks and instant finality — Injective produces blocks in ~600ms with single-block finality — there's nothing to shortcut. **Standard transfer on Injective is already faster than Fast Transfer would be on, say, Ethereum.** Adding a paid-fee fast path would only introduce overhead.

So when you read "Injective: standard only" on Circle's matrix, the right mental model isn't "missing feature" — it's "feature unnecessary, by virtue of the chain being fast enough already."

For the other direction: **inbound from a slow chain into Injective**, the wait is on the *source* chain's finality, so Fast Transfer on the source side (e.g. Ethereum → Injective Fast) would help. The current CLI doesn't expose that — it always uses standard. Adding it is a small change in `cctp.mjs` (lower `minFinalityThreshold`, non-zero `maxFee`, plus a fee fetch from Circle's `/v2/burn/USDC/fees/{src}/{dst}` endpoint).

## Capabilities matrix

| Chain | Standard transfer | Fast transfer | Forwarding |
|---|---|---|---|
| Ethereum, Avalanche, OP, Arbitrum, Base, Polygon | ✓ | ✓ | ✓ |
| Injective EVM | ✓ | — (not needed; see above) | — |

This skill only uses **standard transfer**.

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
