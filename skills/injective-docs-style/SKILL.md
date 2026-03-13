---
name: injective-docs-style
description: Audit and report adherence to Injective's documentation standards
activates_on: ["*.md", "*,mdx*", "*.txt"]
uses: ["injective-mcp-servers", "devrel-docs-style"]
license: MIT
metadata:
  author: bguiz
  version: "0.0.0"
---

# Injective Documentation Style, Skill Guide

Injective provides extensive developer documentation that is available on
https://docs.injective.network (for humans) and
https://docs.injective.network/llms.txt (for robots).
This skill is to assist authors working on Injective's developer documentation.

## When to apply

- When writing developer documentation for Injective
- When writing developer documentation adhering to Injective's developer documentation standards

## Activities

Perform the sequence from the "devrel-docs-style" skill, with some modifications as indicated.

### 1 - Identify which files should be checked

Invoke "identify which files should be checked" from "devrel-docs-style" skill.

### 2 - Review for voice and tone

Invoke "Review for voice and tone" from "devrel-docs-style" skill.

### 3 - Grammar and spelling

Replace the "British English" rule with:
- American English - Use -ize/-yze verbs, -or nouns, -ense nouns, -og nouns (organize, color, license, dialog).

The invoke "grammar and spelling" from "devrel-docs-style" skill.

### 4 - Formatting

The invoke "formatting" from "devrel-docs-style" skill.

### 5 - Word choice

The invoke "word choice" from "devrel-docs-style" skill.

### 6 - Compile a report

The invoke "compile a report" from "devrel-docs-style" skill.

## Related skills

- `devrel-docs-style`
- `injective-mcp-servers`

Use the `devrel-docs-style` skill to connect to the Injective Documentation MCP.
Through this you may search/ consult existing Injective developer documentation.
Use this to check for correctness of any technical terminology that is Injective-specific.

If these skills are not available, selectively run the following commands to install them:

```shell
npx skills add bguiz/devrel-agent-skills --skill devrel-docs-style
npx skills add InjectiveLabs/agent-skills --skill injective-mcp-servers
```

## Prerequisites

- Injective MCP server must be running
- User prompts should be issued from an AI tool that is configured to talk to the Injective MCP server
