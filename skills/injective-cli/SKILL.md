---
name: injective-cli
description: Use the Injective `injectived` CLI against a chain with consistent wallet, endpoint, and gas handling. Use the CLI map and reference docs to find commands and build transactions safely.
license: Apache-2.0
metadata:
  author: injective-labs
  version: "1.17.2"
---

# Injective CLI Skill

## Overview

Use the `injectived` binary to query and transact against an Injective chain with consistent wallet handling, endpoint selection, and gas configuration. Use the bundled CLI command map and reference docs to find the right subcommands and flags quickly.
By invoking any script in this skill, you agree to the Terms of Use in `TERMS_OF_USE`.

## Quick Start

1. Ensure an `injectived` binary is available (local install or docker).
2. Use `references/injectived-cli-map.md` to navigate subcommands.
3. Run `injectived <path> --help` to confirm flags before executing.

## Workflow

### 1) Locate the binary

Use a local `injectived` binary if possible. If it is not on PATH, pass the absolute path when running commands (or use a shell alias). If you must use Docker, run the CLI inside the container and point to the container's `injectived`.

### 2) Use the CLI against the chain

Use `references/injectived-use.md` and `references/injectived-advanced.md` for CLI context, and home directory details. Use the command map `references/injectived-cli-map.md` to find the right subcommand. Spot check critical paths (for example `query`, `tx`, `keys`) by running `injectived <path> --help`.

### 3) Refresh the CLI command map (as needed)

The command map should track the installed `injectived` binary. If you suspect a discrepancy between docs and the local binary, regenerate the map using the script in `scripts/` and diff it against the current map.

Example:

```bash
python3 scripts/map_injectived_cli.py --output /tmp/injectived-cli-map.new.md
diff -u references/injectived-cli-map.md /tmp/injectived-cli-map.new.md
```

## Account and Endpoint Conventions

- Use `~/.injectived` as the home dir for config and key material, unless overriden by user.
- Read endpoint and chain-id from `~/.injectived/config/client.toml` (fields: `node`, `chain-id`).
- Use these defaults when configuring the client:
  - mainnet endpoint: `https://sentry.tm.injective.network:443`
  - mainnet chain-id: `injective-1`
  - testnet endpoint: `https://testnet.sentry.tm.injective.network:443`
  - testnet chain-id: `injective-888`
- If the keystore prompts for a passphrase, pipe it in:
  - `yes "passphrase" | injectived tx ...`
  - `cat ~/.injectived/keystore_password.txt | injectived tx ...` (opt-in stored passphrase)
- Use `--yes` on transactions to skip interactive confirmation.
- Use `--gas auto --gas-adjustment 1.5 --gas-prices 160000000inj` for fee estimation.
- After broadcasting, verify with `injectived q tx <tx_hash>`.
- When creating a new keystore, store the passphrase in `~/.injectived/new_keystore_password.txt`, remind the user to remember it, and delete the file after use.

## Resources

### scripts/

- `map_injectived_cli.py`: Recursively runs `injectived <cmd> --help` to refresh the CLI mapping of commands.

### references/

- `injectived-cli-map.md`: Command map for the `injectived` binary.
- `injectived-use.md`: Official usage documentation (Mintlify export).
- `injectived-advanced.md`: Advanced CLI documentation (Mintlify export).
