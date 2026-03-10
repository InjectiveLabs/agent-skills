---
name: injective-trading-bridge
description: Bridge tokens to and from Injective using deBridge DLN (fast, cross-chain) or Peggy (Ethereum canonical bridge). Supports inbound bridges from Arbitrum, Ethereum, Base, Polygon, BSC, Avalanche, and Optimism into Injective, and outbound bridges from Injective to any deBridge-supported chain. Get quotes before executing. Requires the Injective MCP server to be connected.
uses: ["injective-mcp-servers"]
license: MIT
metadata:
  author: ckhbtc
  version: "0.0.0"
---

## Injective Trading Bridge, Skill Guide

Move tokens cross-chain to/from Injective using two bridge protocols:

- **deBridge DLN** - fast (minutes), supports Arbitrum, Base, Ethereum, Polygon, BSC, Avalanche, Optimism
- **Peggy** - Injective's canonical Ethereum bridge (~30 min, decentralized)

Always get a quote first (`bridge_debridge_quote` / `bridge_debridge_inbound_quote`), *before* executing.

## When to apply

- Bridging tokens from other networks into Injective
- Bridging tokens from Injective into other networks

Sample prompts: `./references/sample-prompts.md`

## Important

### Common tokens and network info

See `./references/common-tokens.md` for common tokens.

See `./references/common-networks.md` for common networks.

### Notes

- deBridge DLN settles in minutes. Quote includes fee breakdown and estimated receive amount.
- The inbound flow reuses the Injective wallet's private key on the source EVM chain
  - this works because Injective uses the same secp256k1 curve as Ethereum.
- If the source chain has no configured default RPC, provide `rpcUrl` explicitly.
- After an inbound bridge, tokens arrive on Injective EVM. Use `subaccount_deposit` to move them into the trading subaccount.

## Activities

### Bridge tokens from Injective to other network using DeBridge

Step 1 - Obtain quote:

```
bridge_debridge_quote
  address: inj1...         ← sender (Injective)
  srcTokenDenom: usdt      ← denom on Injective (symbol or full denom)
  amount: 50               ← human-readable amount
  dstChain: arbitrum       ← or: base, ethereum, polygon, bsc, avalanche, optimism
  dstTokenAddress: 0xaf88d065e77c8cc2239327c5edb3a432268e5831   ← USDC on Arbitrum
  recipient: 0x...         ← EVM address on destination chain
```

Step 2 - Execute quote:

```
bridge_debridge_send
  address: inj1...
  password: ****
  srcTokenDenom: usdt
  amount: 50
  dstChain: arbitrum
  dstTokenAddress: 0xaf88...
  recipient: 0x...
```

### Bridge tokens from other network to Injective using DeBridge

The Injective wallet's private key (secp256k1) signs on both chains,
the same private key works on EVM chains.

Step 1 - Obtain quote:

```
bridge_debridge_inbound_quote
  srcChain: arbitrum       ← or chain ID: 42161
  srcTokenAddress: 0xaf88d065e77c8cc2239327c5edb3a432268e5831   ← USDC on Arbitrum
  amount: 50
  dstTokenAddress: 0x88f7f2b685f9692caf8c478f5badf09ee9b1cc13   ← USDT on Injective EVM
  recipient: inj1...       ← or 0x EVM address on Injective
```

Step 2 - Execute quote:

This performs an ERC20 approve + bridge transaction on source chain.

```
bridge_debridge_inbound_send
  address: inj1...         ← Injective wallet (key used on source chain too)
  password: ****
  srcChain: arbitrum
  srcTokenAddress: 0xaf88...
  amount: 50
  dstTokenAddress: 0x88f7...
  recipient: inj1...
```

### Bridge tokens from Injective to Ethereum using Peggy

This method is slower, but also decentralized.
Expect to take ~30min.

```
bridge_withdraw_to_eth
  address: inj1...
  password: ****
  denom: peggy0xdac17f958d2ee523a2206206994597c13d831ec7   ← USDT denom on Injective
  amount: 100
  ethRecipient: 0x...
```

## Related skills

- `injective-mcp-servers`

If these skills are not available, selectively run the following commands to install them:

```shell
npx skills add InjectiveLabs/agent-skills --skill injective-mcp-servers
```

## Prerequisites

- Injective MCP server must be running
- User prompts should be issued from an AI tool that is configured to talk to the Injective MCP server
