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

## Repository layout

| Path | Contents |
| --- | --- |
| `spec/` | The specification and harness mappings, in Markdown. These are the source of the site's spec pages. |
| `schema/` | JSON Schema for `AGENT.md` frontmatter. |
| `examples/` | Example CAF agents. |
| `site/` | Home page, page layout and static assets. |
| `scripts/validate.mjs` | Validates CAF agents against the schema and naming rules. |
| `build.mjs` | Builds the static site into `dist/`. |

## Working on it

```bash
npm install
npm run validate          # check examples/ (or pass other directories)
npm run build             # write the site to dist/
npm run serve             # build and serve dist/ locally
```

`dist/` is plain static HTML and can be hosted anywhere. The included GitHub Actions workflow deploys it to GitHub Pages on pushes to `main`, with a `CNAME` for `commonagents.io`.
