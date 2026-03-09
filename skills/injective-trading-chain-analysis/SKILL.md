---
name: injective-trading-chain-analysis
description: Analyze Injective chain-level code and protocol specs. Read Go source from injective-core, explain exchange module features (position offsetting, liquidations, margin tiers, funding), and identify spec gaps. Use when discussing chain mechanics, reviewing Injective Go code, or explaining protocol behavior.
uses: ["injective-mcp-servers"]
license: MIT
metadata:
  author: ckhbtc
  version: "0.0.0"
---

## Injective Trading Chain Analysis, Skill Guide

Analyze Injective chain-level protocol code (Go/Cosmos SDK).
Explain exchange module mechanics, review spec completeness,
and trace execution paths for derivatives trading features.

## When to apply

-

Sample prompts: `./references/sample-prompts.md`

## Important

### Exchange module

Key files for the source code of the Injective exchange module may be found in: `./references/injective-core-key-files.md`

### Cosmos SDK Context

- Injective is built on Cosmos SDK (currently v0.47.x)
- Uses Tendermint BFT consensus
- Exchange module is a custom Cosmos SDK module
- State stored in IAVL tree via keeper pattern
- Messages processed in `DeliverTx` phase of ABCI

## Activities

### Explain Injective's exchange module

The exchange module (`x/exchange`) handles all trading on Injective.

Key areas:

- Derivative Markets
  - `MsgCreateDerivativeMarketOrder` / `MsgCreateDerivativeLimitOrder`
  - Position management: open, close, reduce, increase
  - Margin: initial margin, maintenance margin, margin ratio checks
  - Liquidation: forced closure when margin ratio < maintenance margin
- Position Offsetting (`MsgOffsetPosition`)
  - Allows netting opposing positions between subaccounts
  - Reduces total margin requirements
  - Chain-level implementation in `derivative_liquidations.go`
- Liquidation Engine
  - Triggered when position margin < maintenance margin requirement
  - Liquidator receives a portion of remaining margin as reward
  - Insurance fund covers negative PnL if position is underwater
  - Code path: `derivative_liquidations.go` → `ExecuteLiquidation()`
- Funding Rates
  - Calculated every hour for perpetual markets
  - Formula: `FundingRate = (TWAP_perp - TWAP_oracle) / TWAP_oracle`
  - Capped by `MaxFundingRate` parameter per market
  - Applied to all open positions proportional to quantity
- Market Parameters
  - `InitialMarginRatio`, `MaintenanceMarginRatio`
  - `MakerFeeRate`, `TakerFeeRate` (can be negative for rebates)
  - `MinPriceTickSize`, `MinQuantityTickSize`
  - `OracleType`, `OracleScaleFactor`

### Analyze chain code

1. **Read the Go source** from the user's local clone or fetch from GitHub (`InjectiveLabs/injective-core`)
2. **Trace the execution path** from message handler → keeper → state changes
3. **Explain in plain English** what the code does, step by step
4. **Identify spec gaps** - what's missing, ambiguous, or could break
5. **Compare to docs** - check if behavior matches published documentation

## Related skills

- `injective-mcp-servers`

If these skills are not available, selectively run the following commands to install them:

```shell
npx skills add InjectiveLabs/agent-skills --skill injective-mcp-servers
```

## Prerequisites

- Injective MCP server must be running
- User prompts should be issued from an AI tool that is configured to talk to the Injective MCP server
