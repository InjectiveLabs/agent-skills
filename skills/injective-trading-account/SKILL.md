---
name: injective-trading-account
description: Analyze any Injective wallet address. Query bank balances across all token types (INJ, USDT, IBC assets, Peggy ERC-20s), inspect trading subaccount balances, and view open perpetual positions with unrealized P&L. Useful for portfolio monitoring, position management, and pre-trade checks. Requires the Injective MCP server to be connected.
uses: ["injective-mcp-servers"]
license: MIT
metadata:
  author: ckhbtc
  version: "0.0.0"
---

# Injective Account Skill Guide

Query balances and open positions for any Injective account.
No transactions/ signatures required.
All reads are public.

## When to apply

- When you are trading on Injective, and need information about your account
- When you are performing queries but not intending to perform transactions

## MCP Tools

The following tools in the **Injective MCP Server** are used by this skill.
Use the `injective-mcp-servers` skill for instructions on set up and usage.
The "activities" section describes the when and how to make these tool calls.

### account_balances

Returns bank + subaccount balances for an address.

```text
account_balances
  address: inj1...
  denom: usdt         ← optional: filter to one token
```

Returns:
- `bankBalances[]` - wallet-level balances (all denoms or filtered)
- `subaccountBalances[]` - per-subaccount trading balances
  - `subaccountId` - 0x... hex ID
  - `denom` - token denom
  - `deposit.totalBalance` - total (available + in orders)
  - `deposit.availableBalance` - free to trade

### account_positions

Returns open perpetual positions with P&L.

```text
account_positions
  address: inj1...
  market: BTC         ← optional: filter by symbol
```

Returns per position:
- `market` - symbol (BTC, ETH, etc.)
- `direction` - long | short
- `quantity` - contracts held
- `entryPrice` - average entry in USDT
- `markPrice` - current oracle price
- `unrealizedPnl` - USDT P&L at mark price
- `margin` - posted margin
- `leverage` - effective leverage

### token_metadata

Resolve any denom to human-readable metadata.

```text
token_metadata
  denom: peggy0xdac17f958d2ee523a2206206994597c13d831ec7
```

Returns: `{ symbol, name, decimals, type, peggyDenom }`

## Activities

When the user's request contains the following questions, map them to the indicated MCP tool calls.

### "What's my balance?"

```text
account_balances(address: inj1...)
→ show bankBalances + subaccountBalances summary
```

### "Do I have enough USDT to trade?"

```text
account_balances(address: inj1..., denom: usdt)
→ check subaccountBalances[0].deposit.availableBalance
```

If bank balance has USDT but subaccount doesn't: use `subaccount_deposit` to move funds in.

### "Show my positions and P&L"

```text
account_positions(address: inj1...)
→ display each position with entry vs mark price and unrealizedPnl
```

### "What's my total portfolio value?"

```
account_balances    → sum all balances in USD equivalent
account_positions   → add unrealized P&L
```

## Denoms

Denoms are analogous to cryptocurrencies and fungible tokens.
Injective, being a MultiVM blockchain, supports multiple categories of denoms.

Denoms of different categories have different formats. See: `./references/denom-formats.md`
Use `token_metadata` to resolve any denom to a human-readable symbol.

## Subaccount IDs

Injective uses subaccounts for isolated margin.

The default subaccount index is `0`:
`subaccountId = address + "000000000000000000000000" + "0".padStart(24, "0") + "0000"`

In practice, the MCP tools default to subaccount index `0` automatically.
Advanced users can specify `subaccountId` explicitly on trade tools.

## Related skills

This skill uses the following skills:

- `injective-mcp-server`

If these skills are not available, selectively run the following commands to install them:

```shell
npx skills add InjectiveLabs/agent-skills --skill injective-mcp-servers
```

## Prerequisites

- Injective MCP server must be running
- User prompts should be issued from an AI tool that is configured to talk to the Injective MCP server
