# Implementation status — 2026-11-26

Confirmed predecessor: local commit `2ca4edf`; historical base for the cumulative patch: `3323249`. The main implementation was merged through PR #16 and the README correction through PR #17. GitHub Pages is live at <https://milekv.github.io/sql-atlas/>. The latest Polish content review is an additional local change until its own PR is merged and deployed.

## Implemented in current source

- P0: source ranges, selected repeated findings, Monaco markers and click navigation, PL/EN web/CLI/Action/VS Code language support. A targeted CTE action scan now checks the main DELETE/UPDATE rather than WHERE inside the CTE; regression tests cover SQL Server and PostgreSQL cases.
- P1: bounded SQL Server Showplan XML parser, actual/estimated operator tree, per-thread counters, object/index, estimated/actual rows, executions, parallel flags, DOP and granted/used memory. Two real Microsoft SQL Server plans with 27 and 34 operators are tested in addition to synthetic edge cases. The UI has a navigable tree, operator detail panel and a second-plan structural comparison. The source samples have different `QueryHash`; the UI warns against interpreting the comparison as a speedup for the same query.
- P1: separate STATISTICS IO/TIME Messages importer with table reads and compile/execution timings. It intentionally does not correlate independently pasted messages to the imported plan.
- Benchmark Lab: PostgreSQL synthetic data generator, equality check (`EXCEPT ALL`) and repeated JSON EXPLAIN ANALYZE scripts. No PostgreSQL measurements were possible in this environment.
- Repository: English/Polish READMEs, architecture/plan/integration/benchmark/release/security documentation, third-party notice, SVG banner and 1280×640 Social Preview. Application screenshots were captured from local Chromium after exercising the features. The public browser demo reflects the merged source; npm, VS Code Marketplace and the tagged GitHub Action remain at 0.8.0.
- The Monaco editor and its worker are bundled locally. A browser test exposed the earlier CDN dependency by leaving the editor at “Loading...” when network access was restricted; the corrected build loads Monaco without external requests.

## Verification and blockers

The merged implementation passed 116 tests across 17 files, typecheck and web/CLI/Action/VS Code builds. The current content corrections also passed 116 tests, typecheck and the full build locally. `npm pack --dry-run` listed six package files, and `npm run package:vscode` generated a VSIX with English/Polish localization files. Headless Chromium with Playwright exercised the analyzer, clicked a finding, imported two Microsoft plans, compared them, imported IO/TIME, switched to Polish and visited index, knowledge and dialect pages; there were no page errors or external asset requests. The final Monaco change was also exercised against the production preview. This was targeted browser smoke testing, not exhaustive coverage. No SQL Server or PostgreSQL instance was available for benchmark measurements.

## Remaining work

P0 still needs comprehensive PL/EN page review and a dialect-aware parser for cases where regex/lexical masking is insufficient. P1 still needs more real plans across SQL Server versions, statement classes, adaptive operators and runtime warning variants; values are reported, not interpreted as causal diagnoses. Oracle DBMS_XPLAN, measured benchmarks, a real VS Code screenshot, VSIX/Action smoke testing and release version alignment are incomplete. Do not label this source 1.0.
