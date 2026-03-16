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
git clone https://github.com/InjectiveLabs/mcp-server injective-mcp-server
cd injective-mcp-server
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

## Known Gotchas

Critical findings for anyone building on or extending the MCP server, or integrating with MetaMask.

### EIP-712 Signing (MetaMask)

- **Use V2, not V1.** V1 (`getEip712TypedData`) uses non-standard domain types (`verifyingContract: "cosmos"`, `salt: "0"` as strings). MetaMask's `eth_signTypedData_v4` silently produces invalid signatures with V1. Always use `getEip712TypedDataV2` + `SIGN_EIP712_V2`.
- **Fee objects must match exactly.** `getEip712TypedDataV2()` and `createTransaction()` must receive the exact same fee object. If one uses the SDK default and the other a custom fee, the chain reconstructs different typed data → hash mismatch → signature verification failure.
- **`evmChainId` can be any EVM chain.** Injective EIP-712 signing works regardless of which EVM chain MetaMask is connected to. Read chain ID from `eth_chainId` and pass to both the EIP-712 domain and `createWeb3Extension`.

### SDK `fromJSON` Scaling

- **`MsgCreateDerivativeMarketOrder.fromJSON` applies ×10^18 internally.** It expects values in chain units (price/margin already ×10^6 for USDT markets), then appends 18 decimal places for protobuf. Pass: `price = humanPrice × 10^6`, `margin = humanMargin × 10^6`, `quantity = humanQty` (not scaled by quote decimals).

### Margin Calculation

- **Add 1–2% buffer above exact minimum.** If `margin == price × qty × initialMarginRatio` exactly, the chain may reject due to rounding.
- **Use `max(oraclePrice, markPrice)` for validation.** The chain validates margin against the higher of oracle and mark price. Margin calculated from oracle alone may be insufficient if mark > oracle.
- **`stakeUsdt` is margin, not notional.** In web apps, the user's stake parameter is their margin. `qty = stake × leverage / price`, not `notional / price`.

### Close Orders

- **Use `margin: '0'` for reduce-only.** No separate `isReduceOnly` flag needed on Injective.
- **Use 1% slippage for closes.** 5% slippage can trigger "order price surpasses bankruptcy price" for low-leverage positions.

### Subaccount Deposits

- **Bank balance ≠ exchange subaccount balance.** A `MsgDeposit` (or `subaccount_deposit` tool call) is required to move USDT from bank → subaccount before placing derivative orders. Always check subaccount balance and auto-deposit if needed.

### Deployment (Express / Web Apps)

- **Serve from the correct subdirectory.** If `server.js` serves from `dist/`, deploy built files to `dist/`, not the project root.
- **Set no-cache headers on HTML.** Without `Cache-Control: no-cache, no-store, must-revalidate` on HTML responses, browsers serve stale JS bundles after deploys.

## Related skills

This skill does not use or depend upon any other skill.

## Prerequisites

Must have Node.js v22 or higher.
Check with `node -v`.
