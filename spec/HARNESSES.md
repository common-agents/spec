---
title: Harness mappings
---

# Harness mappings

This page is informative, not part of the specification. It records where each harness keeps its agents and how an installer translates each CAF field. Harnesses change their formats often; corrections are welcome by pull request.

Cells marked † are taken from third-party documentation and have not been checked against the harness's own docs.

## Where agents live

| Harness | ID | Project file | User file | Native format |
| --- | --- | --- | --- | --- |
| Claude Code | `claude-code` | `.claude/agents/<name>.md` | `~/.claude/agents/<name>.md` | Markdown + YAML frontmatter |
| GitHub Copilot | `copilot` | `.github/agents/<name>.agent.md` | `~/.copilot/agents/<name>.agent.md` | Markdown + YAML frontmatter |
| Codex | `codex` | `.codex/agents/<name>.toml` | `~/.codex/agents/<name>.toml` | TOML |
| Gemini CLI | `gemini-cli` | `.gemini/agents/<name>.md` | `~/.gemini/agents/<name>.md` | Markdown + YAML frontmatter |
| Cursor | `cursor` | `.cursor/agents/<name>.md` | `~/.cursor/agents/<name>.md` | Markdown + YAML frontmatter |
| Kiro | `kiro` | `.kiro/agents/<name>.md` | `~/.kiro/agents/<name>.md` | Markdown + YAML frontmatter (JSON also accepted) |
| OpenCode | `opencode` | `.opencode/agents/<name>.md` † | `~/.config/opencode/agents/<name>.md` † | Markdown + YAML frontmatter |
| Grok Build | `grok` | `.grok/agents/<name>.md` † | `~/.grok/agents/<name>.md` † | Markdown † |
| Kilo Code | `kilo` | `.kilo/agents/<name>.md` † | † | Markdown † |
| Antigravity | `antigravity` | `.agents/agents/<name>/agent.md` | `~/.gemini/config/agents/<name>/agent.md` | Markdown + YAML frontmatter |

## Field mappings

"Warn" means the harness has no equivalent: the installer leaves the field out and tells the user. "Refuse" means leaving it out would give the agent more access than its definition allows, so the installer stops unless the user accepts that.

### Claude Code

| CAF | Claude Code |
| --- | --- |
| `name`, `description` | `name`, `description` |
| body | Markdown body |
| `model` tiers | `inherit` → `inherit`, `fast` → `haiku`, `balanced` → `sonnet`, `strong` → `opus` |
| `effort` | `effort` |
| `tools` | `tools`: `read` → `Read`; `search` → `Glob`, `Grep`; `edit` → `Edit`, `Write`, `NotebookEdit`; `execute` → `Bash`; `web` → `WebFetch`, `WebSearch`; `agent` → `Agent`; `todo` → `TodoWrite`; `mcp:s` → `mcp__s`; `mcp:s/t` → `mcp__s__t` |
| `disallowed-tools` | `disallowedTools`, same mapping |
| `max-turns` | `maxTurns` |
| `skills` | `skills` (preloaded); bundled skills go to `.claude/skills/` |
| `mcp-servers` | `mcpServers` (inline entries) |
| `invocation.model: false` | Warn |
| `invocation.user: false` | Warn |
| `harness/claude-code/files/` | copied into `.claude/` |

### GitHub Copilot

| CAF | Copilot |
| --- | --- |
| `name`, `description` | `name`, `description` |
| body | Markdown body (cloud agent limit: 30,000 characters) |
| `model` tiers | Installer table; `inherit` leaves `model` unset |
| `effort` | Warn |
| `tools` | `tools`: capability names are Copilot's own aliases; `mcp:s` → `s/*`; `mcp:s/t` → `s/t` |
| `disallowed-tools` | Expanded into an allowlist in `tools`. Refuse if `tools` is absent and the remaining set cannot be listed. |
| `max-turns` | Warn |
| `skills` | Bundled skills go to `.github/skills/`; not preloaded |
| `mcp-servers` | `mcp-servers` (cloud agent only; ignored by IDEs, so warn when the user installs for VS Code) |
| `invocation.model: false` | `disable-model-invocation: true` |
| `invocation.user: false` | `user-invocable: false` |
| `metadata` | `metadata` |

### Codex

| CAF | Codex |
| --- | --- |
| `name`, `description` | `name`, `description` |
| body | `developer_instructions` (TOML multi-line string) |
| `model` tiers | Installer table; `inherit` leaves `model` unset |
| `effort` | `model_reasoning_effort` |
| `tools` without `execute` | `features.shell_tool = false` |
| `tools` without `edit` | Refuse: Codex agents cannot override `sandbox_mode`, so file access follows the parent session |
| `tools` without `web` | `web_search = "disabled"` † |
| `tools` without `read` / `search` | Warn (advisory restriction) |
| `max-turns` | Warn |
| `skills` | Bundled skills go to `.agents/skills/`; not preloaded |
| `mcp-servers` | Warn: agents inherit the session's `mcp_servers`. Offer to add them to `config.toml`. |
| `invocation` | Warn |

### Gemini CLI

| CAF | Gemini CLI |
| --- | --- |
| `name`, `description` | `name`, `description` |
| body | Markdown body |
| `model` tiers | Installer table |
| `effort` | Warn |
| `tools` | `tools` †: `read` → `read_file`; `search` → `glob`, `grep_search`; `edit` → `write_file`, `replace`; `execute` → `run_shell_command`; `web` → `web_fetch`, `google_web_search` |
| `max-turns` | `max_turns` † |
| `skills`, `mcp-servers`, `invocation` | Warn |

Gemini CLI subagents do not inherit tool permissions, so an absent `tools` field is written as the full list of built-in tools.

### Cursor

| CAF | Cursor |
| --- | --- |
| `name`, `description` | `name`, `description` |
| body | Markdown body |
| `model` tiers | `inherit` → `inherit`, `fast` → `fast`, others → installer table |
| `tools` without `edit` and `execute` | `readonly: true` † |
| any other binding `tools` restriction | Refuse |
| advisory `tools` restriction | Warn |
| `effort`, `max-turns`, `skills`, `mcp-servers`, `invocation` | Warn |

### Kiro

Kiro reads the same fields from Markdown frontmatter or JSON. Installers SHOULD write Markdown, so the body stays readable. Project agents are loaded only when the workspace is trusted.

| CAF | Kiro |
| --- | --- |
| `name`, `description` | `name`, `description` |
| body | Markdown body (the `prompt` field in JSON) |
| `model` tiers | Installer table; `inherit` leaves `model` unset |
| `effort` | Warn |
| `tools` | `tools`: `read` → `read`; `search` → `read` †; `edit` → `write`; `execute` → `shell`; `web` → `web`; `agent` → `subagent`; `mcp:s` → `@s`; `mcp:s/t` → `@s/t`; `*` → `*` |
| `tools` with `todo` | Warn: there is no tag for `todo_list` |
| `disallowed-tools` | `excludedTools`, same mapping |
| `max-turns` | Warn |
| `skills` | Bundled skills go to `.kiro/skills/`; each is listed in `resources` as `skill://.kiro/skills/<skill>/SKILL.md`, which loads its name and description at startup and the rest on demand |
| `mcp-servers` | `mcpServers` (same keys; `${VAR}` references are kept) |
| `invocation` | Warn |
| `harness/kiro/files/` | copied into `.kiro/` |

### Antigravity

Antigravity accepts either `<name>.md` or a folder `<name>/agent.md`. Installers SHOULD use the folder form, so bundled skills and references can sit next to the agent: paths in `skills` are resolved relative to the agent file.

| CAF | Antigravity |
| --- | --- |
| `name`, `description` | `name`, `description` |
| body | Markdown body |
| `model` tiers | `inherit` → `inherit`, `fast` → `flash`, `balanced` → `flash` (the harness default), `strong` → `pro` |
| `effort` | Warn |
| `tools` | `tools` (exact tool names): `read` → `view_file`, `list_dir`; `search` → `grep_search`, `find_by_name`; `edit` → `replace_file_content`, `write_to_file` †; `execute` → `run_command`; `web` → `read_url_content`, `search_web` †; `agent` → `invoke_subagent`; `todo` → `manage_task` |
| `tools` absent | Write every built-in tool name. Antigravity's default for `tools` is an empty list, so leaving it out would give the agent no tools. |
| `tools` with `mcp:s` | Add server `s` to `mcpServers` |
| `tools` with `mcp:s/t` | Refuse: tools cannot be limited to one tool per server † |
| `disallowed-tools` | Expanded into an allowlist in `tools`; there is no denylist field |
| `max-turns` | Warn |
| `skills` | Bundled skills are copied to `<name>/skills/<skill>/` and listed as `skills/<skill>`. Other skills are reached through inherited customisations (`inheritCustomizations`, on by default). |
| `mcp-servers` | `mcpServers`, as a list of server objects † |
| `invocation.user` | `mainAgent` |
| `invocation.model` | `subagent` |
| `references/`, `assets/` | Copied next to `agent.md` |
| `harness/antigravity/files/` | copied into `.agents/` |

Antigravity documents that a misspelled tool name can make the agent hang, so installers SHOULD check generated tool names against the installed CLI version.

Common native settings to put under `harness.antigravity.settings`: `commandExecutionPolicy` (`off`, `auto`, `eager`, `sandbox`), `rules`, `agents`, `inheritCustomizations` and `excludeDefaultComponents`.
