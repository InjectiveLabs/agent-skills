# Injective Frontend Wallet

Public skill for building, reviewing, or debugging browser frontends that sign
and broadcast Injective transactions.

Use it when you need to:

- wire Keplr, Leap, MetaMask, or SDK browser signing flows
- debug `EthAccount`, ethsecp256k1 pubkey, signer, sequence, or CheckTx errors
- build a CosmWasm or swap-contract UI on Injective
- review wallet-connected trading actions for duplicate broadcast risks

## Installation

Install via NPM into the current project:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-frontend-wallet
```

Install globally:

```bash
npx skills add InjectiveLabs/agent-skills --global --skill injective-frontend-wallet
```

## Start Here

Read [SKILL.md](./SKILL.md) for account type, pubkey, signing, and browser
trading-flow checks.

## Status

This skill is docs-only. It does not ship wallet code or private-key handling.
