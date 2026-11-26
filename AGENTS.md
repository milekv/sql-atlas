# SQL Atlas contributor instructions

Use `src/core/analyzer` as the single source of SQL diagnostics for the web app, CLI, VS Code, and GitHub Action. Keep the package local-first; never send user SQL or imported plans to an external service.

Before changing a rule, reproduce its false positive or missed case in `src/tests`. Preserve original source offsets, test comments and literals, and check the dialect in question. An absent finding means only that the active rules did not flag the input. Do not present a static score as measured speed or verified safety.

Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` before proposing a release. Keep English and Polish user-facing strings in sync. Do not claim support for plans or dialect syntax without fixtures and tests. Update `docs/IMPLEMENTATION_STATUS.md` with confirmed outcomes and remaining limitations.

Project workflows live in `.agents/skills/`; read the matching `SKILL.md` when implementing a rule, plan parser, UI, translation, or release.
