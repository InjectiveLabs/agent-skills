---
name: injective-cctp
description: Bridge native USDC into and out of Injective EVM via Circle's CCTP V2 burn-and-mint. Inbound from Ethereum, Arbitrum, Base, OP Mainnet, Polygon, or Avalanche; outbound from Injective EVM to any of those. Handles approve, depositForBurn, attestation polling, and receiveMessage — no relayer, no aggregator, no custodian. Use when the user asks to move USDC into Injective (deposit) or out of Injective (withdraw), or wants to script a CCTP transfer programmatically.
license: MIT
metadata:
  author: ckhbtc
  version: "1.0.0"
---

# Injective CCTP Skill

## Overview

Circle's **Cross-Chain Transfer Protocol (CCTP) V2** is a burn-and-mint mechanism for moving **native USDC** between supported chains. CCTP burns USDC on the source chain, an off-chain attestation service signs a transfer message, and anyone can submit that message + attestation to the destination chain to mint native USDC there.

This skill covers both directions across the Injective EVM boundary:

| Direction | Source | Destination |
|---|---|---|
| **Deposit** | Ethereum / Arbitrum / Base / OP / Polygon / Avalanche | Injective EVM (chain id 1776, CCTP domain 29) |
| **Withdraw** | Injective EVM | Any of the above |

Two ways to run it:

- **Live widget** (humans): https://usdc.inj.so — the same flow with a wallet UI.
- **Headless CLI** (agents): `scripts/cctp.mjs` — viem + a private key, runs end-to-end.

## When to apply

Sample triggers:
- "Bridge 100 USDC from Ethereum to Injective"
- "Withdraw 500 USDC from Injective to Arbitrum"
- "How do I move USDC out of Injective EVM?"
- "Set up a CCTP transfer in a script"
- "Why isn't my CCTP transfer minting?" (recovery — see below)

Skip this skill if the user asks about:
- Bridging non-USDC assets to/from Injective → use `injective-bridge` (deBridge / Peggy)
- Moving USDC between Cosmos chains via IBC → not CCTP
- Solana CCTP → out of scope; uses a separate SDK

## The 5-step flow

CCTP V2 transfers always go through these steps. The skill's CLI walks them automatically; reading them helps debug if something stalls.

| # | Step | Where | What |
|---|---|---|---|
| 1 | Approve | Source chain | `USDC.approve(TokenMessenger, amount)` — only if current allowance < amount |
| 2 | Burn | Source chain | `TokenMessengerV2.depositForBurn(amount, dstDomain, mintRecipient, USDC, 0x0, 0, 2000)` |
| 3 | Attest | Off-chain (Circle) | Poll `https://iris-api.circle.com/v2/messages/{srcDomain}?transactionHash={txHash}` until `status === complete` |
| 4 | Switch | Wallet | Switch the signing wallet to the destination chain |
| 5 | Mint | Destination chain | `MessageTransmitterV2.receiveMessage(message, attestation)` — permissionless; anyone can call it |

Standard transfer parameters (Injective doesn't support fast transfer):
- `destinationCaller = bytes32(0)` — anyone can mint
- `maxFee = 0`
- `minFinalityThreshold = 2000` (waits for finalized attestation)
- `mintRecipient = pad(address, { size: 32 })` — bytes32-padded EVM address

## Quick start (CLI)

```sh
cd scripts
npm install
export CCTP_PRIVATE_KEY=0x...                  # the signing key (same key on both chains)
node cctp.mjs --from ethereum --amount 100      # Ethereum → Injective (deposit)
node cctp.mjs --from injective --to base --amount 50   # Injective → Base (withdraw)
node cctp.mjs --from injective --amount 50 --recipient 0xabc...   # withdraw to a different recipient
```

Supported `--from` / `--to` values: `ethereum`, `arbitrum`, `base`, `optimism`, `polygon`, `avalanche`, `injective`. One side must always be `injective`.

The script:
1. Connects via viem with the env private key.
2. Reads the USDC allowance on the source TokenMessenger; approves if short.
3. Calls `depositForBurn` and waits for the receipt.
4. Polls Circle's iris-api every 5s until the attestation is `complete` (Ethereum source ≈ 13 min; L2 / Polygon / Avalanche typically < 1 min — Injective standard transfer only).
5. Switches client to the destination chain and submits `receiveMessage`.
6. Prints the mint tx hash and exits.

## Live widget (for humans)

If the user is not scripting and just wants a UI, point them at **https://usdc.inj.so**. It does the same 5-step flow with whatever EIP-1193 wallet they have (MetaMask, Rabby, Coinbase Wallet, Frame, etc.). Source: [github.com/ckhbtc/usdc-widget](https://github.com/ckhbtc/usdc-widget).

## Recovery — stuck transfer

If the burn went through but the mint never landed (tab crashed, wrong network, ran out of gas, etc.), the funds are NOT lost — they're held by the attestation, waiting for someone to submit the mint. Recovery:

1. Get the burn tx hash from the source chain explorer.
2. Look up the message + attestation:
   ```
   GET https://iris-api.circle.com/v2/messages/{srcDomain}?transactionHash={burnTxHash}
   ```
3. Switch the wallet to the destination chain.
4. Call `MessageTransmitterV2.receiveMessage(message, attestation)` on `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` (deterministic, same address on every V2-enabled chain).

Anyone can submit step 4 — it doesn't have to be the original burner.

`scripts/cctp.mjs` accepts a `--resume <burnTxHash> --from <chain>` flag that does steps 2-4 automatically.

## Reference

CCTP V2 contract addresses are **deterministic across all V2-enabled chains**:

| Contract | Address |
|---|---|
| `TokenMessengerV2` | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| `MessageTransmitterV2` | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |
| `TokenMinterV2` | `0xfd78EE919681417d192449715b2594ab58f5D002` |

Per-chain values (USDC contract, EVM chain id, Circle domain id) live in `scripts/chains.mjs`. See `references/domains.md` for Circle's full domain list and `references/architecture.md` for a deeper dive into the V2 protocol.

USDC on Injective EVM: `0xa00C59fF5a080D2b954d0c75e46E22a0c371235a` (Cosmos bank denom: `erc20:0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`).

## Constraints

- **EVM only.** Solana CCTP uses a different SDK and is out of scope.
- **Standard transfer only on Injective.** Injective is V2-enabled but doesn't support Fast Transfer per Circle's [supported-chains list](https://developers.circle.com/cctp/cctp-supported-blockchains). Source-chain Fast Transfer to/from chains other than Injective is supported but not exposed by this skill.
- **One transfer at a time.** No queueing, no parallel runs against the same address (allowance race).
- **Native USDC only.** Do not pass bridged USDC (`USDC.e`, `USDCnb`, etc.) — the source `usdc` address in `chains.mjs` is always Circle-issued native.
