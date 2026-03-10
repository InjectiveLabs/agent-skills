---
name: injective-trading-tokens
description: Look up metadata for any Injective token or denom. Resolves native tokens (INJ), Peggy ERC-20 bridged tokens (USDT, USDC, WETH), IBC assets (ATOM, OSMO), TokenFactory tokens, and EVM ERC-20s to their human-readable symbol, decimals, and type. Also supports sending tokens between addresses and depositing/withdrawing from trading subaccounts. Requires the Injective MCP server to be connected.
uses: ["injective-mcp-servers"]
license: MIT
metadata:
  author: ckhbtc
  version: "0.0.0"
---

# Injective Trading Tokens, Skill Guide

Resolve, inspect, and move tokens on Injective.
Supports all Injective denom formats and handles token transfers between wallets and subaccounts.

## When to apply

- When you are interacting with tokens/ denoms on Injective.

## MCP Tools

The following tools in the **Injective MCP Server** are used by this skill.
Use the `injective-mcp-servers` skill for instructions on set up and usage.
The "activities" section describes the when and how to make these tool calls.

### token_metadata

Resolve any denom to human-readable info.

```text
token_metadata
  denom: peggy0xdac17f958d2ee523a2206206994597c13d831ec7
```

Returns:
- `symbol` - e.g. USDT
- `name` - Tether USD
- `decimals` - 6
- `type` - peggy | ibc | native | factory | erc20
- `peggyDenom` - ERC-20 contract address (Peggy tokens only)

### transfer_send

Send tokens to another Injective address.

```text
transfer_send
  address: inj1...      ← sender (must be in keystore)
  password: ****
  to: inj1...           ← recipient
  denom: inj            ← token denom (or symbol shorthand)
  amount: 10            ← human-readable amount
```

### subaccount_deposit

Move tokens from bank wallet into a trading subaccount.

```text
subaccount_deposit
  address: inj1...
  password: ****
  denom: usdt
  amount: 100
  subaccountIndex: 0    ← optional, default 0
```

### subaccount_withdraw

Move tokens from trading subaccount back to bank wallet.

```text
subaccount_withdraw
  address: inj1...
  password: ****
  denom: usdt
  amount: 100
  subaccountIndex: 0
```

## Popular Denoms

See: `./references/popular-denoms.md`

For any other denoms/ tokens, use `token_metadata` with the full denom string.

## Activities

When the user's request contains the following questions, map them to the MCP tool calls indicated.

### "What token is peggy0x...?"

```text
token_metadata(denom: peggy0x...)
```

### "Send 5 INJ to a friend"

```text
transfer_send(address: inj1me..., to: inj1friend..., denom: inj, amount: 5)
```

### "I have USDT in my wallet but can't trade"

USDT is in your bank balance, not your trading subaccount.

```text
subaccount_deposit(address: inj1..., denom: usdt, amount: <amount>)
```

### "Move profits back to my wallet"

```text
subaccount_withdraw(address: inj1..., denom: usdt, amount: <amount>)
```

## Notes

- Amounts are always in human-readable format (e.g. `1.5` for 1.5 USDT). The server handles decimal conversion internally.
- INJ has 18 decimals - never enter wei amounts; use `1.5` for 1.5 INJ.
- Token metadata is resolved against the on-chain Injective token registry and cached.
- IBC denoms are long hashes - use `token_metadata` to get the symbol before displaying to users.
