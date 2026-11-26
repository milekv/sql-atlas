---
name: sql-atlas-release
description: Validate SQL Atlas changes before tagging, packaging or publishing a release. Use for CI, changelog and release work.
---

# Release workflow

From a clean checkout run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`. Inspect generated web, CLI, Action, and extension artifacts; test installation when packaging VSIX. Record exact results and limitations in the changelog and implementation status. Keep a branch and reviewable PR. Publish to npm, GitHub Pages, or VS Code Marketplace only after the release gates and owner approval.
