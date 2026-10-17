# Common Agent Format

The Common Agent Format (CAF) describes a custom coding agent once, in a Markdown file with YAML frontmatter, so an installer can write it out for Claude Code, GitHub Copilot, Codex, Gemini CLI, Cursor and other harnesses.

```markdown
---
name: docs-writer
description: Updates README and docs/ to match the current code. Use after a feature lands or an interface changes.
model: balanced
tools: [read, search, edit]
---

You keep a project's documentation in step with its code.
```

- [Specification](spec/SPECIFICATION.md)
- [Harness mappings](spec/HARNESSES.md)
- [JSON Schema for the frontmatter](schema/caf-1.0.schema.json)
- [Example agents](examples/)

Website: [commonagents.io](https://commonagents.io). Its source is in a separate repository; the spec pages are generated from the Markdown files here.

## Repository layout

| Path | Contents |
| --- | --- |
| `spec/` | The specification and harness mappings. |
| `schema/` | JSON Schema for `AGENT.md` frontmatter. |
| `examples/` | Example CAF agents. |
| `scripts/validate.mjs` | Validates CAF agents against the schema and naming rules. |

## Validating agents

```bash
npm install
npm run validate                       # checks examples/
node scripts/validate.mjs path/to/dir  # checks every agent folder in dir
```

## Contributing

Changes to the format are made by pull request. Corrections to [harness mappings](spec/HARNESSES.md) are especially welcome, since harnesses change their agent formats often.

## Installers

[Agent Manager](https://github.com/ai-agent-manager/agent-manager) is the reference installer.
