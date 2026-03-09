# agent-skills

Skills to use Injective chain from agents like Claude Code and others.

Tested on:

* Claude Code
* Codex
* Amp

## injective-cli

Use the `injectived` binary to query and transact against an Injective chain with consistent wallet handling, endpoint selection, and gas configuration.

Installing skill:

```bash
uvx upd-skill InjectiveLabs/injective-cli
```

Installing skill globally:

```bash
uvx upd-skill InjectiveLabs/injective-cli --global
```

Install via NPX:

```bash
npx skills add https://github.com/InjectiveLabs/agent-skills --skill injective-cli
```

## injective-evm-developer

Develop EVM smart contracts and dApps on Injective.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-evm-developer
```

See [`skills/injective-evm-developer`](./skills/injective-evm-developer/README.md)
for more information.

## injective-mcp-servers

Set up and use MCP servers that are important for Injective.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-mcp-servers
```

See [`skills/injective-mcp-servers`](./skills/injective-mcp-servers/README.md)
for more information.

## injective-trading-account

Set up and use MCP servers that are important for Injective.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-account
```

See [`skills/injective-trading-account`](./skills/injective-trading-account/README.md)
for more information.

## injective-trading-tokens

Look up metadata for any Injective token or denom. Resolves native tokens (INJ), Peggy ERC-20 bridged tokens (USDT, USDC, WETH), IBC assets (ATOM, OSMO), TokenFactory tokens, and EVM ERC-20s to their human-readable symbol, decimals, and type. Also supports sending tokens between addresses and depositing/withdrawing from trading subaccounts. Requires the Injective MCP server to be connected.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-tokens
```

See [`injective-trading-tokens`](./skills/injective-trading-tokens/README.md)
for more information.

## injective-trading-autosign

Set up AuthZ delegation on Injective for session-based auto-trading.
Grants a scoped, time-limited permission to an ephemeral key so the AI can place and close perpetual trades
without a wallet popup or password prompt for every order.
Use authz_grant to enable, authz_revoke to disable.
Requires the Injective MCP server to be connected.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-autosign
```

See [`injective-trading-autosign`](./skills/injective-trading-autosign/README.md)
for more information.

## injective-trading-bridge

Bridge tokens to and from Injective using deBridge DLN (fast, cross-chain) or Peggy (Ethereum canonical bridge).
Supports inbound bridges from Arbitrum, Ethereum, Base, Polygon, BSC, Avalanche, and Optimism into Injective,
and outbound bridges from Injective to any deBridge-supported chain.
Get quotes before executing.
Requires the Injective MCP server to be connected.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-bridge
```

See [`injective-trading-bridge`](./skills/injective-trading-bridge/README.md)
for more information.

## injective-trading-chain-analysis

Analyze Injective chain-level code and protocol specs.
Read Go source from injective-core, explain exchange module features
(position offsetting, liquidations, margin tiers, funding), and identify spec gaps.
Use when discussing chain mechanics, reviewing Injective Go code, or explaining protocol behavior.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-chain-analysis
```

See [`injective-trading-chain-analysis`](./skills/injective-trading-chain-analysis/README.md)
for more information.

## injective-trading-market-data

Access real-time market data for Injective perpetual futures markets.
Query oracle prices, list all active markets with metadata (tick size, min notional, max leverage),
and retrieve current spread and funding information.
Requires the Injective MCP server to be connected.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-market-data
```

See [`injective-trading-market-data`](./skills/injective-trading-market-data/README.md)
for more information.

## injective-trading-staking

Query and manage Injective staking delegations, rewards, and validator info.
Look up staker addresses, delegation amounts, unbonding status, and claimed rewards via Injective LCD/REST API.

Install via NPM:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-staking
```

See [`injective-trading-staking`](./skills/injective-trading-staking/README.md)
for more information.

## linear-cli

Use the `linear` CLI to manage Linear issues, teams, and projects from the terminal with consistent authentication and configuration handling.

Installing skill:

```bash
uvx upd-skill InjectiveLabs/linear-cli
```

Installing skill globally:

```bash
uvx upd-skill InjectiveLabs/linear-cli --global
```

Install via NPX:

```bash
npx skills add https://github.com/InjectiveLabs/agent-skills --skill linear-cli
```

## License

Apache-2.0

## Terms of use

See [TERMS_OF_USE](skills/injective-cli/TERMS_OF_USE).
