#!/usr/bin/env bash
# Blocks `git push` from the code-reviewer agent.
# Reads the PreToolUse payload on stdin; exit code 2 blocks the call.
if grep -q '"command":[^,]*git push'; then
  echo "code-reviewer must not push" >&2
  exit 2
fi
exit 0
