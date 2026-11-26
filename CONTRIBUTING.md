# Contributing to SQL Atlas

Thanks for taking the time to help improve SQL Atlas.

## Before you start

- Search existing issues before opening a new one.
- For a new rule or a change in analyzer behaviour, include representative SQL examples.
- Keep analysis deterministic and local. A rule should not require a remote service.
- Prefer reducing false positives over detecting every possible case.

For a larger change, open an issue first so the expected behaviour can be agreed before implementation.

## Local setup

SQL Atlas requires Node.js 20 or newer.

```bash
git clone https://github.com/milekv/sql-atlas.git
cd sql-atlas
npm ci
npm run dev
```

## Checks

Run the same checks used in CI before submitting a pull request:

```bash
npm run typecheck
npm test
npm run build
```

If a change affects the GitHub Action or VS Code extension, commit the regenerated bundles produced by the build.

## Analyzer changes

Every analyzer change should include tests for:

- the SQL that should trigger the finding
- a nearby valid query that should not trigger it
- quoted identifiers or PostgreSQL-specific syntax where relevant
- configuration and ignore behaviour when the rule supports it

Keep finding messages specific enough that a developer can act on them without reading the implementation.

## Pull requests

- Keep the change focused.
- Explain the behaviour before and after the change.
- Include tests and documentation when public behaviour changes.
- Do not include unrelated formatting or generated-file changes.

By contributing, you agree that your contribution is licensed under the MIT License.

## Plan fixtures and translations

A new plan parser feature should cite the format specification and include a licensed or self-generated real plan fixture where feasible. Keep third-party attribution in `docs/THIRD_PARTY_NOTICES.md`. Do not commit production query text or private plan files. Include both estimated and actual cases, missing counters, invalid input and operator-level edge cases.

For UI changes, add or review corresponding keys in both `en` and `pl` dictionaries. Verify the rendered behavior in a browser when one is available; a typecheck or jsdom test is not visual QA. Add examples to the README only when the source branch actually supports them, and distinguish source-only features from published releases.
