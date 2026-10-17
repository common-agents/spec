---
title: Specification
version: "1.0.0-draft"
---

# Common Agent Format specification

**Version 1.0.0-draft**

The Common Agent Format (CAF) describes a custom agent once, in plain Markdown, so that it can be installed into any coding harness: Claude Code, GitHub Copilot, Codex, Gemini CLI, Cursor, OpenCode, Grok Build and others.

A CAF agent is a directory with an `AGENT.md` file at its root. `AGENT.md` holds YAML frontmatter (metadata and portable settings) followed by a Markdown body (the agent's instructions). Optional subdirectories carry harness-specific settings and files, bundled skills, and reference material.

CAF is a source format. Harnesses do not need to read it directly. An installer, such as [Agent Manager](#installers), reads a CAF agent and writes the native files for the harness it is installing into.

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT" and "MAY" are to be read as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## Directory structure

A CAF agent is a directory containing, at minimum, an `AGENT.md` file:

```
code-reviewer/
├── AGENT.md            # Required: metadata + instructions
├── harness/            # Optional: per-harness settings and files
│   ├── claude-code/
│   │   ├── settings.yaml
│   │   └── files/
│   └── codex/
│       ├── settings.toml
│       └── instructions.md
├── skills/             # Optional: bundled Agent Skills
│   └── review-checklist/
│       └── SKILL.md
├── references/         # Optional: documentation the agent reads on demand
└── assets/             # Optional: templates and other static files
```

The directory name MUST equal the `name` field in `AGENT.md`.

`AGENT.md` MUST NOT be placed at the root of a repository. Some tools treat a root-level `AGENT.md` as an alias for [`AGENTS.md`](https://agents.md), which holds repository-wide instructions rather than an agent definition. Put CAF agents in a named directory, conventionally under `.agents/caf/` in a project or `~/.agents/caf/` for a user:

```
my-project/
└── .agents/
    └── caf/
        ├── code-reviewer/
        │   └── AGENT.md
        └── test-writer/
            └── AGENT.md
```

A collection of agents MAY be distributed as a repository whose top-level directories are each a CAF agent.

## `AGENT.md` format

`AGENT.md` MUST be UTF-8 encoded, and MUST start with YAML frontmatter delimited by `---` lines, followed by a Markdown body.

### Minimal example

```markdown
---
name: code-reviewer
description: Reviews code changes for correctness, security and missing tests. Use after a change is written and before it is committed.
---

You are a code reviewer. Read the diff, then report concrete findings,
most severe first. Do not edit files.
```

### Full example

```markdown
---
name: code-reviewer
description: Reviews code changes for correctness, security and missing tests. Use after a change is written and before it is committed.
caf: "1.0"
version: "1.2.0"
license: Apache-2.0
model: strong
effort: high
tools: [read, search, execute]
max-turns: 30
skills: [review-checklist]
mcp-servers:
  github:
    command: github-mcp-server
    args: [stdio]
    env:
      GITHUB_TOKEN: ${GITHUB_TOKEN}
invocation:
  user: true
  model: true
metadata:
  author: example-org
harness:
  claude-code:
    settings:
      permissionMode: plan
      color: blue
  codex:
    settings:
      model_reasoning_summary: concise
  cursor:
    enabled: false
---

You are a code reviewer. ...
```

### Frontmatter fields

| Field | Required | Type | Summary |
| --- | --- | --- | --- |
| `name` | Yes | string | Identifier. Lowercase letters, digits and hyphens. |
| `description` | Yes | string | What the agent does and when to use it. |
| `caf` | No | string | CAF spec version the file is written against. |
| `version` | No | string | Version of this agent. |
| `license` | No | string | Licence name or bundled licence file. |
| `model` | No | string | Model tier or model identifier. |
| `effort` | No | string | Reasoning effort hint. |
| `tools` | No | list of strings | Allowlist of portable tool capabilities. |
| `disallowed-tools` | No | list of strings | Denylist of portable tool capabilities. |
| `max-turns` | No | integer | Upper bound on agentic turns. |
| `skills` | No | list of strings | Agent Skills to make available to the agent. |
| `mcp-servers` | No | map | MCP servers the agent needs. |
| `invocation` | No | map | Who may start the agent. |
| `compatibility` | No | string | Free-text environment requirements. |
| `metadata` | No | map | Arbitrary string key/value pairs. |
| `harness` | No | map | Per-harness overrides, keyed by harness ID. |

Installers MUST ignore unknown top-level fields and SHOULD warn about them. New fields will be added in later versions of this spec. Tools that need private fields SHOULD put them under `metadata` or `harness`.

#### `name`

- MUST be 1–64 characters.
- MUST contain only lowercase ASCII letters (`a-z`), digits (`0-9`) and hyphens (`-`).
- MUST NOT start or end with a hyphen, or contain two hyphens in a row.
- MUST match the name of the directory containing `AGENT.md`.

These rules are the same as for the `name` field in [Agent Skills](https://agentskills.io/specification), so one name is valid in both formats and in every harness listed in this spec.

#### `description`

- MUST be 1–1024 characters.
- SHOULD say what the agent does *and* when it should be used. Harnesses that delegate to agents automatically use this text to choose one.

Good:

```yaml
description: Writes and updates unit tests for changed code. Use after implementing a feature or fixing a bug, when the change has no tests.
```

Poor:

```yaml
description: Testing agent.
```

#### `caf`

The CAF specification version, as a quoted `MAJOR.MINOR` string, for example `"1.0"`. When absent, installers MUST assume `"1.0"`. An installer that reads a file with a higher major version than it supports MUST refuse to install it.

#### `version`

The version of the agent itself. [Semantic Versioning](https://semver.org) is RECOMMENDED. Installers MAY record it to detect upgrades.

#### `license`

A licence name (an [SPDX identifier](https://spdx.org/licenses/) is RECOMMENDED) or the path of a licence file in the agent directory.

#### `model`

Either a portable **tier** or a **model identifier**.

| Tier | Meaning |
| --- | --- |
| `inherit` | Use the model of the session that starts the agent. This is the default. |
| `fast` | A small, fast, low-cost model. |
| `balanced` | The harness's general-purpose default model. |
| `strong` | The most capable model the harness offers. |

Each installer holds a table mapping tiers to the target harness's model names, and SHOULD let users change that table.

Any other value is a model identifier (for example `claude-opus-5-5` or `gpt-6.1-sol`). It is passed through unchanged to every harness. A model identifier ties the agent to one vendor's models, so authors SHOULD use a tier in `model` and put identifiers in `harness.<id>.settings`, where they apply only to the matching harness.

#### `effort`

One of `low`, `medium`, `high`. A hint for how much reasoning the model should spend. Installers map it to the harness's own setting (for example `effort` in Claude Code, `model_reasoning_effort` in Codex) and omit it where the harness has none.

#### `tools`

A list of portable tool capabilities the agent is allowed to use. When `tools` is absent, the agent gets the harness default, which is usually every tool the session has. An empty list (`[]`) means no tools.

| Capability | Covers |
| --- | --- |
| `read` | Reading files. |
| `search` | Finding files and searching their contents. |
| `edit` | Creating, changing and deleting files. |
| `execute` | Running shell commands. |
| `web` | Fetching URLs and searching the web. |
| `agent` | Starting other agents. |
| `todo` | Keeping a task list. |
| `mcp:<server>` | Every tool from the named MCP server. |
| `mcp:<server>/<tool>` | One tool from the named MCP server. |
| `*` | Every tool. |

The capability names match the tool aliases GitHub Copilot already uses for custom agents, so a Copilot user will recognise them.

A harness-native tool name (for example `Bash(git:*)` in Claude Code) MAY be given in `harness.<id>.settings`. Native names MUST NOT appear in the top-level `tools` list.

Leaving out `edit`, `execute`, `web`, `agent` or an `mcp:` entry is a **binding** restriction: it stops the agent changing files, running commands, reaching the network or starting other agents. Leaving out `read`, `search` or `todo` is **advisory**, since those capabilities neither change anything nor reach the network, and some harnesses cannot remove them. See [Installers](#installers) for how each kind is handled.

#### `disallowed-tools`

A list of capabilities, in the same vocabulary as `tools`, that the agent MUST NOT use. It is applied after `tools`.

#### `max-turns`

A positive integer. The most agentic turns (model calls followed by tool calls) the agent may take before it stops.

#### `skills`

A list of [Agent Skills](https://agentskills.io) names. Each name refers to either:

1. a skill bundled in this agent's `skills/` directory, or
2. a skill the user already has installed in the target harness.

Installers MUST install bundled skills alongside the agent. Where the target harness supports preloading skills into an agent (for example `skills` in Claude Code), installers SHOULD set it. Where it does not, the skills are installed but not preloaded.

#### `mcp-servers`

A map of MCP server name to server configuration. The configuration uses the same keys as the `mcpServers` entries most harnesses already read:

| Key | Type | Meaning |
| --- | --- | --- |
| `command` | string | Executable for a local (stdio) server. |
| `args` | list of strings | Arguments for `command`. |
| `env` | map of strings | Environment variables for the server. |
| `url` | string | Endpoint for a remote (HTTP) server. |
| `headers` | map of strings | HTTP headers for a remote server. |

Each server MUST have exactly one of `command` or `url`.

Values MAY contain `${NAME}` or `${NAME:-default}` references. Installers MUST NOT expand these references when writing files. They MUST write them in the target harness's own reference syntax, or leave them unexpanded if the harness reads environment variables itself. Secrets MUST NOT be written into CAF files.

Some harnesses cannot attach MCP servers to a single agent (for example Codex, where agents inherit the session's servers). In that case the installer MUST tell the user which servers the agent expects, and MAY offer to add them to the harness's global configuration.

#### `invocation`

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `user` | boolean | `true` | A person may pick the agent by name. |
| `model` | boolean | `true` | The harness may delegate to the agent automatically, based on `description`. |

#### `compatibility`

1–500 characters of free text describing what the agent needs: system packages, network access, a particular harness. Most agents do not need it.

#### `metadata`

A map of string keys to string values for information this spec does not define. Use reasonably unique keys to avoid clashes.

#### `harness`

A map keyed by [harness ID](#harness-ids). Each value is a map with these optional keys:

| Key | Type | Meaning |
| --- | --- | --- |
| `enabled` | boolean | `false` stops the agent being installed into this harness. Default `true`. |
| `settings` | map | Native settings for this harness, merged into the generated definition. |
| `path` | string | Directory holding files for this harness. Default `harness/<id>`. |

See [Harness-specific configuration](#harness-specific-configuration).

### Body

The Markdown body after the frontmatter is the agent's instructions. Installers write it to the harness's system prompt field: the Markdown body in Claude Code, Copilot, Gemini CLI and Cursor, or `developer_instructions` in Codex.

There are no format restrictions. Structure that works well across harnesses:

1. **Role.** One or two sentences on what the agent is.
2. **Scope.** What it should and should not do.
3. **Method.** The steps it follows.
4. **Output.** What it hands back, and in what shape.

Keep the body under about 500 lines. Move long reference material into `references/` and link to it.

The body SHOULD NOT name harness-specific tools ("use the Bash tool"). Say what to do ("run the test suite") and let each harness pick the tool. Where a harness needs different wording, use [`instructions.md`](#instructionsmd).

### File references

Link to other files in the agent directory with paths relative to the agent root:

```markdown
Follow the checklist in [references/checklist.md](references/checklist.md).
```

Keep references one level deep. Installers copy `references/` and `assets/` to a location the agent can read and MUST rewrite relative links in the body so they still resolve after installation.

## Harness-specific configuration

Portable fields cover what most harnesses share. Everything else goes in harness-specific configuration, which comes from two places for each harness ID:

1. the `harness.<id>` entry in the frontmatter, for small settings, and
2. the `harness/<id>/` directory (or the directory named by `harness.<id>.path`), for anything larger.

A harness directory MAY contain:

| Path | Meaning |
| --- | --- |
| `settings.yaml`, `settings.json` or `settings.toml` | Native settings for the harness. Only one of these may be present. |
| `instructions.md` | Extra instructions for this harness only. |
| `files/` | Files copied into the harness's configuration directory. |

### Settings

Settings are written in the target harness's own field names, so `permissionMode` for Claude Code and `model_reasoning_effort` for Codex. Installers do not translate them.

Settings are merged in this order, later entries overriding earlier ones key by key:

1. Values the installer derives from portable fields.
2. The harness directory's settings file.
3. `harness.<id>.settings` in the frontmatter.

So an author can let `model: strong` choose a model everywhere, then pin a particular model for one harness:

```yaml
model: strong
harness:
  claude-code:
    settings:
      model: opus
```

### `instructions.md`

If present, its contents are appended to the body, separated by a blank line, when installing into that harness. If the file's first line is `<!-- caf:replace -->`, the file replaces the body instead.

### `files/`

Files under `files/` are copied into the harness's configuration directory, keeping their relative paths. For Claude Code this is the `.claude/` directory of the install scope. A hook script at `harness/claude-code/files/hooks/check.sh` therefore installs to `.claude/hooks/check.sh`.

Installers MUST NOT overwrite an existing file that they did not create without asking first.

## Harness IDs

| ID | Harness |
| --- | --- |
| `claude-code` | Claude Code |
| `copilot` | GitHub Copilot (VS Code and cloud agent) |
| `codex` | OpenAI Codex |
| `gemini-cli` | Gemini CLI |
| `cursor` | Cursor |
| `opencode` | OpenCode |
| `grok` | Grok Build |
| `kilo` | Kilo Code |
| `antigravity` | Google Antigravity |

New IDs are added by pull request to this spec. Until an ID is listed, tools SHOULD use a reverse-domain name (`com.example.myharness`) to avoid collisions.

See [Harness mappings](harnesses.html) for where each harness keeps its agents and how each CAF field is translated.

## Installers

An installer turns a CAF agent into a harness's native files. [Agent Manager](https://github.com/ai-agent-manager/agent-manager) is the reference installer. A conforming installer:

1. MUST validate `AGENT.md` against this spec, and refuse to install it if a required field is missing or invalid.
2. MUST skip a harness whose `harness.<id>.enabled` is `false`.
3. MUST apply the [settings merge order](#settings).
4. MUST translate every portable field it can, and SHOULD warn about each field the target harness cannot represent.
5. MUST NOT give an agent more access than its definition allows. If `tools` or `disallowed-tools` sets a binding restriction that the target harness cannot enforce, the installer MUST refuse to install unless the user explicitly accepts the wider access. If it cannot enforce an advisory restriction, it SHOULD warn.
6. MUST NOT write secrets into generated files, and MUST NOT expand `${...}` references at install time.
7. SHOULD record which files it created, so that it can upgrade or remove them later without touching files it did not create.
8. SHOULD support both project scope (for example `.claude/agents/`) and user scope (for example `~/.claude/agents/`).

## Validation

A [JSON Schema](schema/caf-1.0.schema.json) for the frontmatter is published with this spec. It checks field types and formats. It cannot check that `name` matches the directory name, or that bundled skill names exist; validators MUST check those separately.

## Relationship to other formats

- **[Agent Skills](https://agentskills.io).** CAF follows its layout and naming rules on purpose. A skill is a capability any agent can load; a CAF agent is a role with its own instructions, model and tool limits. CAF agents bundle skills in `skills/`.
- **[AGENTS.md](https://agents.md).** Repository-wide instructions read by every agent working in a repository. CAF describes one named agent and is not read at repository root.
- **Native agent files** (`.claude/agents/*.md`, `.github/agents/*.agent.md`, `.codex/agents/*.toml` and so on). These are what installers produce. CAF is the source they are generated from.

## Changes

- **1.0.0-draft.** First public draft.
