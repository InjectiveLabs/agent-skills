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
