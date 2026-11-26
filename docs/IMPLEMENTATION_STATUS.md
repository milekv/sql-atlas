# Implementation status — 2026-11-26

Confirmed predecessor: local commit `2ca4edf`; base for cumulative patch: `3323249`. New changes remain local until a GitHub branch/PR can be written.

## Implemented in current source

- P0: source ranges, selected repeated findings, Monaco markers and click navigation, PL/EN web/CLI/Action/VS Code language support. A targeted CTE action scan now checks the main DELETE/UPDATE rather than WHERE inside the CTE; regression tests cover SQL Server and PostgreSQL cases.
- P1: bounded SQL Server Showplan XML parser, actual/estimated operator tree, per-thread counters, object/index, estimated/actual rows, executions, parallel flags, DOP and granted/used memory. Two real Microsoft SQL Server plans with 27 and 34 operators are tested in addition to synthetic edge cases. The UI has a navigable tree, operator detail panel and a second-plan structural comparison. The source samples have different `QueryHash`; the UI warns against interpreting the comparison as a speedup for the same query.
- P1: separate STATISTICS IO/TIME Messages importer with table reads and compile/execution timings. It intentionally does not correlate independently pasted messages to the imported plan.
- Benchmark Lab: PostgreSQL synthetic data generator, equality check (`EXCEPT ALL`) and repeated JSON EXPLAIN ANALYZE scripts. No PostgreSQL measurements were possible in this environment.
- Repository: synchronized English/Polish READMEs, architecture/plan/integration/benchmark/release/security documentation, third-party notice, SVG banner and 1280×640 Social Preview. Current application screenshots were captured from local Chromium after exercising the features. Published artifacts remain at their earlier versions.
- The Monaco editor and its worker are bundled locally. A browser test exposed the earlier CDN dependency by leaving the editor at “Loading...” when network access was restricted; the corrected build loads Monaco without external requests.

## Verification and blockers

`npm test` passed 116/116 tests across 17 files; `npm run build` passed typecheck plus web/CLI/Action/VS Code builds. The optimized Monaco import passed a repeated typecheck and production web build. `npm pack --dry-run` listed six package files, and `npm run package:vscode` generated a VSIX with the English/Polish localization files. The browser plugin failed with “Browser access requires the originating browser context”; local Chromium points to a missing binary and the cloud browser cannot reach local Vite (`ERR_CONNECTION_REFUSED`). An npm installed headless Chromium with Playwright provided a fallback. It exercised the analyzer, clicked a finding, imported two Microsoft plans, compared them, imported IO/TIME, switched to Polish and visited index, knowledge and dialect pages; there were no page errors or external asset requests. The final Monaco change was also exercised against the production preview. This is a targeted browser smoke test, not exhaustive coverage. No SQL Server or PostgreSQL instance was available to execute benchmark cases.

## Remaining work

P0 still needs comprehensive PL/EN page review and a dialect-aware parser for cases where regex/lexical masking is insufficient. P1 still needs more real plans across SQL Server versions, statement classes, adaptive operators and runtime warning variants; values are reported, not interpreted as causal diagnoses. Oracle DBMS_XPLAN, measured benchmarks, a real VS Code screenshot, VSIX/Action smoke testing, package version alignment and external publication are incomplete. Do not label this source 1.0 or a released update.
