# Changelog

## Unreleased

## 0.7.0 - 2026-08-21

### Integrations

- Add SARIF 2.1.0 CLI output for GitHub Code Scanning and compatible viewers.
- Include stable rule IDs, severity levels and source locations in SARIF results.

### Analysis accuracy

- Evaluate rules per SQL statement so one query cannot hide or trigger a finding in another query.
- Keep Index Advisor candidates scoped to the statement that produced them.
- Only report literal `NOT IN` null risk when the list contains an actual `NULL` token.
- Accept `NOT IN` subqueries that explicitly filter null values.
- Stop guessing PostgreSQL implicit conversion risk from column names and unknown string literals.

## 0.6.0 - 2026-08-13

### Analysis accuracy

- Mask PostgreSQL strings, nested comments and dollar-quoted bodies before structural analysis.
- Keep semicolons inside PostgreSQL function bodies from splitting statements.
- Avoid duplicate findings for `NOT IN` subqueries.
- Recognize intentional `NATURAL JOIN` syntax and commas nested in `GROUP BY` expressions.

### Configuration

- Add validated JSON rule configuration for the CLI and GitHub Action.
- Add command, workflow and SQL comment based rule ignores.
- Exclude disabled rules from findings, scores and passed checks.

## 0.5.1 - 2026-08-13

### Packaging

- Preserve the `sql-atlas` executable when publishing through the npm registry.
- Normalize npm package metadata before the first registry release.

## 0.5.0 - 2026-08-13

### GitHub Action

- Analyze SQL files selected with newline-separated glob patterns.
- Add pull request annotations with file and line information when available.
- Write the full Markdown analysis to the job summary.
- Expose file count, finding count and lowest score as action outputs.
- Enforce severity and minimum score policies without external services.
- Run as a bundled Node.js 24 action without downloading dependencies at runtime.

### Packaging

- Move browser build dependencies out of the CLI package runtime dependencies.
- Keep the CLI release package self-contained and dependency-free at runtime.

## 0.4.0 - 2026-08-13

### CLI

- Analyze one or more SQL files from the terminal.
- Read SQL from standard input.
- Select PostgreSQL, MySQL, Oracle, SQLite, SQL Server or generic SQL.
- Produce human-readable text, structured JSON or Markdown reports.
- Write reports to a file with `--output`.
- Enforce CI policies with `--fail-on` and `--min-score`.
- Return stable exit codes for success, policy failures and input errors.

### Packaging

- Build a standalone Node.js 20 CLI bundle.
- Include only the CLI, documentation, changelog and license in the npm package.
- Add unit coverage for arguments, input modes, reports, policy failures and errors.

## 0.3.0 - 2026-08-13

First tagged release of SQL Atlas as a usable local SQL analysis toolkit.

### Query analysis

- Detect common SQL performance and safety problems with deterministic rules.
- Suggest indexes for filters, joins, grouping and ordering.
- Export analysis results as Markdown.
- Compare PostgreSQL, MySQL, Oracle, SQLite and SQL Server syntax.

### PostgreSQL EXPLAIN

- Parse `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` output locally.
- Display execution metrics and the plan tree.
- Flag estimation errors, sequential scans, costly sorts and disk usage.

### PostgreSQL schemas

- Parse `CREATE TABLE` statements locally.
- Display columns, data types, primary keys and unique constraints.
- Build foreign key relationships between tables.
- Warn about references to tables missing from the pasted schema.

### Project

- English and Polish interface.
- Local browser processing with no backend or tracking.
- Automated tests and GitHub Pages deployment.

## 0.2.0

- Added the PostgreSQL EXPLAIN JSON parser and visual plan tree.
- Added execution time, cost, row estimate and buffer metrics.
- Added deterministic warnings for expensive plan operations.

## 0.1.0

- Added the query analyzer, index advisor and Markdown report export.
- Added the SQL knowledge base, anti-pattern library and dialect comparison.
- Added English and Polish UI, automated tests and GitHub Pages deployment.
