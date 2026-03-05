# Injective EVM Developer skill

Read the [`SKILL.md`] file, as it is self-describing (as all skill files should be).
Note that this skill conforms to the [Agent Skills specification](https://agentskills.io/specification).

## Installation

Install via NPM into current directory, for use in current proejct only:

```bash
npx skills add InjectiveLabs/agent-skills --skill injective-evm-developer
```

Install via NPM globally, for use in all projects:

```bash
npx skills add InjectiveLabs/agent-skills --global --skill injective-evm-developer
```

## Usage

Once you have a skill installed, when you enter a prompt in your agent that supports skills
(specifically an AI development harness, such as Claude Code),
the harness will use the LLM and determine whether it is appropriate to activate this skill,
based on your prompt and contents of the `SKILL.md` file.

In other words, just prompt as you would anyway, and if relevant, this skill should activate.

See `references/sample-prompts.md` within the skill directory for sample prompts.