---
name: sql-atlas-core
description: Maintain the shared SQL Atlas analyzer, source ranges, deterministic rules and dialect handling. Use when editing analyzer rules or diagnostic consumers.
---

# Shared analyzer workflow

Read `src/core/analyzer/analyzeQuery.ts`, `types.ts`, `analyzerUtils.ts`, and the affected rule. Reproduce the issue with a failing test that includes a positive and a false-positive case. Keep offsets relative to the original source, including comments and whitespace. Check all four consumers: web, CLI/SARIF, VS Code, and GitHub Action. Treat regex-based matching as partial syntax support; document unsupported constructs. Count occurrences separately from score impact. Run the targeted tests, then the full suite and build.
