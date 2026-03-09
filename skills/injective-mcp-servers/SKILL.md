---
name: injective-mcp-servers
description: Set up and run Injective MCP servers. Needed by multiple Injective skills which perform MCP tool calls. 
license: MIT
metadata:
  author: bguiz
  version: "0.0.0"
---

# Injective MCP Servers, Skill Guide

Model-Context-Protocol (MCP) servers facilitate discovery and expose tools, intended to be called by LLMs.
This skill provides instructions on how to set up and use MCP servers that are important for Injective.

## When to apply

- When you are searching for canonical information about Injective, use **Injective Documentation MCP Server**.
- When you are querying or transacting on Injective Mainnet or Testnet, use **Injective MCP Server**.
- When you are using full trading capabilities, including perpetual futures, spot transfers, cross-chain bridging, and raw EVM transactions, use **Injective MCP Server**.

## Activities

### Set up and run Injective Documentation MCP Server

Not applicable, as we provide a hosted MCP server for you.
Simply connect to `https://docs.injective.network/mcp`,
which exposes a streamable HTTP endpoint that most MCP clients are able to consume.

### Use Injective Documentation MCP Server

Perform MCP tool calls:

- `SearchInjectiveDocs` - Searches official Injective documentation. Returns results including citations.

See: https://docs.injective.network/developers-ai/documentation-mcp.md

### Set up and run Injective MCP Server

Installation:

```shell
git clone https://github.com/InjectiveLabs/mcp-server injective-mcp-server && cd injective-mcp-server
npm install && npm run build
```

Run manually:

```shell
INJECTIVE_NETWORK="mainnet" node ./dist/mcp/server.js
```

Run via Claude Code:

Edit `~/.claude/mcp.json` or the MCP configuration within your project to include the following:

```json
{
  "mcpServers": {
    "injective": {
      "command": "node",
      "args": ["/path/to/injective-mcp-server/dist/mcp/server.js"],
      "env": {
        "INJECTIVE_NETWORK": "mainnet"
      }
    }
  }
}
```

### Use Injective MCP Server

Perform MCP tool calls:

- `wallet_generate` - Generate a new Injective wallet. Returns address + mnemonic (shown once).
- `wallet_import` - Import a wallet from a hex private key.
- `wallet_list` - List all wallets in the local keystore (addresses only - no keys).
- `wallet_remove` - Permanently delete a wallet from the keystore.
- `market_list` - List all active perpetual futures markets.
- `market_price` - Get the current oracle price for a market by symbol (e.g. `BTC`).
- `account_balances` - Get bank + subaccount balances. Supports all token types.
- `account_positions` - Get open perpetual positions with unrealized P&L.
- `token_metadata` - Look up symbol, decimals, and type for any denom.
- `trade_open` - Open a position with a market order (Cosmos signing).
- `trade_close` - Close an open position with a market order (Cosmos signing).
- `trade_open_eip712` - Open a position using EIP-712 Ethereum signing (MetaMask-compatible keys).
- `trade_close_eip712` - Close a position using EIP-712 Ethereum signing (MetaMask-compatible keys).
- `trade_limit_open` - Open a limit order.
- `trade_limit_orders` - List open limit orders.
- `trade_limit_close` - Cancel a limit order by `orderHash`.
- `trade_limit_states` - Query order states by order hash.
- `transfer_send` - Send tokens to another Injective address.
- `subaccount_deposit` - Deposit from bank balance into a trading subaccount.
- `subaccount_withdraw` - Withdraw from a trading subaccount back to bank balance.
- `bridge_withdraw_to_eth` - Withdraw to Ethereum via the Peggy bridge (~30 min, fee applies).
- `bridge_debridge_quote` - Get a deBridge DLN quote to any supported chain. Read-only.
- `bridge_debridge_send` - Bridge tokens from Injective to another chain via deBridge DLN.
- `evm_broadcast` - Broadcast a raw EVM transaction on Injective EVM.

See: https://raw.githubusercontent.com/InjectiveLabs/mcp-server/refs/heads/main/README.md

## Related skills

This skill does not use or depend upon any other skill.

## Prerequisites

Must have Node.js v22 or higher.
Check with `node -v`.
