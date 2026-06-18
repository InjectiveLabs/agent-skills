# Injective Trading Frontend UX

Public skill for building, reviewing, or debugging Injective browser trading
interfaces.

Use it when you need to:

- review trade button, open, close, cash-out, or bulk action states
- make wallet, AuthZ, autosign, RFQ, and USDC readiness visible in the UI
- prevent duplicate broadcasts and account sequence races
- sanitize user-facing RFQ, CheckTx, and transaction errors
- keep market search and trading card layouts stable

## Installation

Install via NPM into the current project:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-trading-frontend-ux
```

Install globally:

```bash
npx skills add InjectiveLabs/agent-skills --global --skill injective-trading-frontend-ux
```

## Start Here

Read [SKILL.md](./SKILL.md) for the frontend UX checklist and cross-skill
handoffs.

## Status

This skill is docs-only. It does not ship frontend code or custody any keys.
