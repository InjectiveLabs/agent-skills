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

- Always run: "Check documentation style"
- Only run if explicitly requested: "Verify technical correctness"

### 1 - Check documentation style

Invoke the "devrel-docs-style" skill, and specify use of American English.

### 2 - Verify technical correctness

Invoke the "injective-mcp-servers" skill, and connect to the Injective Documentation MCP server.

Use this to validate technical correctness of all pages that were checked in the previous step "Check documentation style".
Do so by:

- Make a list of claims, based on the contents of the files
  - Identify any new claims made
  - Identify any existing claims modified or removed
- For each claim, based on the Injective Documentation MCP server.
  - Find supporting evidence
  - Find contradicting evidence

Based on this, create a list of all the claims, for each claim:
- short description: 6 to 12 words
- quote: text of each claim made, verbatim, as found in file
- location: file path relative to project dir, and a single line number or range of line numbers, e.g. `./foo/bar.md:123-125`
- likelihood of correctness:
  - at least 80% sure claim is correct -> "Likely correct"
  - less than 80% sure claim is correct -> "Maybe correct"
  - less than 80% sure claim is wrong -> "Maybe wrong"
  - at least 80% sure claim is wrong -> "Likely wrong"
- rationale: reason for chosen likelihood of correctness

Use format: `./assets/claims-template.md`

### 3 - Assemble report

- Start with the report file output in the "Check documentation style" step
- Append the result from the "Verify technical correctness" step
  - The "## Claims" section should be inserted right above the "## Reproducing this report" section
- Write file to disk with the same filename

## Related skills

- `devrel-docs-style`
- `injective-mcp-servers`

Use the `injective-mcp-servers` skill to connect to the Injective Documentation MCP.

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
