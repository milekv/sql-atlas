# Changelog

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
