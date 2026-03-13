---
name: injective-docs-style
description: Audit and report adherence to Injective's documentation standards
activates_on: ["*.md", "*,mdx*", "*.txt"]
uses: ["injective-mcp-servers"]
license: MIT
metadata:
  author: bguiz, theletterf
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

See for detailed list of user stories: `./references/user-stories.md`
Their associated sample prompts: `./references/sample-prompts.md`

## Activities

Perform the following sequence

### 1 - Identify which files should be checked

- If this is a Github PR
  - Check all files that have been added or modified in the PR
  - Ignore any deleted files
- If this skill is invoked manually
  - Any input arguments (e.g. `${ARGS}`) should be considered as either file names or file path globs
  - Check the explicitly specified files and files that match the glob

### 2 - Review for voice and tone

- **Active voice** - Prefer active over passive.
- **Present tense** - Write in present tense.
- **Second person** - Use "you/your/yours." Never use "I/me/my." Use "we" sparingly.
- **No "please"** - Avoid "please" in instructions.
- **Contractions** - Don't mix contractions with spelled-out equivalents in the same context. Avoid ambiguous contractions ("there'd," "it'll," "they'd").
- **Concise sentences** - Maximum 2 conjunctions per sentence. Split into multiple sentences.
- **Informational tone** - Be direct, neutral, and scannable. May use some friendly tones in tutorials.
- **Latin abbreviations** - Permitted. "e.g." and "for example" are both OK.

### 3 - Grammar and spelling

- **American English** - Use -ize/-yze verbs, -or nouns, -ense nouns, -og nouns (organize, color, license, dialog).
- **Oxford comma** - Always use in lists of three or more.
- **Abbreviations** - Spell out on first use. Pluralize without apostrophes (APIs, SDKs, OSes).
- **Capitalization** - Sentence-style for headings. Capitalize proper nouns and product names only. Don't capitalize all words. Don't capitalize spelled-out acronyms unless proper nouns. Match UI capitalization.
- **Hyphens**: Compound adjectives before nouns (real-time results), two vowels together (re-enable), self-/ex-/all- prefixes. No hyphen for predicate adjectives ("up to date") or adverbs ending in -ly ("newly installed").
- **Gerunds** - Use in top-level task titles. Use action verbs in lower-level titles. Avoid gerunds in prepositional phrases ("how to configure" not "on configuring").
- **Noun vs. verb compounds** - backup/back up, login/log in, setup/set up, startup/start up.

### 4 - Formatting

- **Inline code** - Use monospaced font. In markdown, use single backticks.
- **Multiline code** - Use monospaced font in a dedicated code block. In markdown, use triple backticks and specify the language for syntax highlighting.
- **Double quotation marks** - Use to introduce unfamiliar term on first use. Use when quoting some text from elsewhere (UI, earlier instruction, error message, etc).
- **Single quotation marks** - Use only when there needs to be a quotation within another quotation, and only when absolutely needed. By default, avoid using them.
- **Bold** - Use for emphasis of terms.
- **Italics** - Use for emphasis of thoughts/ideas.
- **Numbers** - For 1 to 9 in as one to nine. For 10 and above as numerals. For 1000 and above use commas per power of 1000, e.g. 1,234,567.
- **Unordered lists** - Must have 2 or more items. Don't use periods unless they are full sentences. Paragraph preceding should end with a colon.
- **Ordered lists** - Same rules as unordered lists, plus: Use only when items must be in specified sequence.
- **Paragraphs** - Maximum 7 sentences.
- **Headings** - Use H1, H2, H3, and H4 headings. Avoid H5, and H6 headings. In markdown, use an empty line after the heading.
- **Links** - Avoid bare URLs. Avoid link text similar to "click here".

### 5 - Word choice

Replace poor phrase choices with preferred phrase choices,
in the list following this pattern:
poor phrase choice (qualifier) -> preferred phrase 1/ preferred phrase 2 (qualifier)

- abort/ kill/ terminate -> cancel/ stop/ exit
- boot -> start/ run
- mentioned above/ mentioned below -> (find another way to reference than by position on page)
- begin -> start
- blacklist -> blocklist
- whitelist -> allowlist
- cannot -> unable
- click -> press/ select (unless specifically referring to mouse-only actions)
- type -> input/ enter (when referring to entering text into a text field, etc.)
- execute -> run/ start
- hack -> workaround/ tip
- wrong -> incorrect
- launch -> open/ run
- utilize -> use
- see -> view/ look

### 6 - Compile a report

Use the following report format: See `./assets/report-template.md`

## Related skills

- `injective-mcp-servers`

Use the `injective-mcp-servers` skill to connect to the Injective Documentation MCP.
Through this you may search/ consult existing Injective developer documentation.
Use this to check for correctness of any technical terminology that is Injective-specific.

If these skills are not available, selectively run the following commands to install them:

```shell
npx skills add InjectiveLabs/agent-skills --skill injective-mcp-servers
```

## Prerequisites

Nil

## Credits

See `./references/credits.md`
