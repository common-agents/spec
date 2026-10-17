---
name: review-checklist
description: Checklist for reviewing a changed file. Use when reviewing code for defects.
---

For each changed file, check:

- Inputs are validated where they enter the system.
- Errors are handled or passed on, never silently dropped.
- New branches and error paths have tests.
- Resources (files, connections, locks) are released on every path.
- No secrets, credentials or personal data are logged or committed.
