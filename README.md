# SQL Atlas

**Interactive SQL Knowledge Base & Performance Toolkit**

SQL Atlas is a local-first, no-AI SQL toolkit for developers. Paste SQL, detect anti-patterns, understand performance risks, suggest indexes, compare SQL dialects, and learn optimization techniques in English and Polish.

[![CI](https://github.com/milekv/sql-atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/milekv/sql-atlas/actions/workflows/ci.yml)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-40c8e8)](https://milekv.github.io/sql-atlas/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![No AI](https://img.shields.io/badge/AI-none-success)](#local-first-privacy)
[![Local-first](https://img.shields.io/badge/privacy-local--first-success)](#local-first-privacy)
[![EN/PL](https://img.shields.io/badge/i18n-EN%20%7C%20PL-blue)](#polski-opis)

**Live demo:** [https://milekv.github.io/sql-atlas/](https://milekv.github.io/sql-atlas/)

> Paste SQL. Find problems. Learn why. Optimize better.

## Why SQL Atlas?

SQL performance issues are common, but the path from "this query is slow" to "I understand what to fix" is often messy. Many developers know SQL syntax, yet struggle with indexes, EXPLAIN plans, joins, pagination, and subtle anti-patterns.

SQL Atlas connects detection with learning. It does not only flag suspicious SQL; it explains why a pattern matters, links it to knowledge topics, suggests practical next steps, and keeps the whole workflow local in the browser.

## Feature Preview

| Module | What it does |
| --- | --- |
| Query Analyzer | Scores SQL quality, groups issues by severity, highlights detected fragments, and shows top recommendations. |
| Index Advisor | Suggests deterministic PostgreSQL-style index candidates from WHERE, JOIN, ORDER BY, GROUP BY, and functional filters. |
| SQL Knowledge Base | Documentation-style learning module with categories, difficulty badges, dialect badges, examples, common mistakes, and performance tips. |
| Anti-Patterns Library | Educational catalog of risky SQL patterns with bad examples, better examples, reasons, and fixes. |
| Dialect Compare | Compares syntax across PostgreSQL, MySQL, Oracle, SQLite, and SQL Server. |
| Markdown Report Export | Generates GitHub-friendly optimization reports with score, findings, passed checks, indexes, and formatted SQL. |
| EXPLAIN Visualizer | Typed placeholder for future PostgreSQL EXPLAIN JSON analysis and visual plan trees. |
| Schema Visualizer | Placeholder architecture for future local schema diagrams. |
| Local-first Privacy | No AI, no backend, no tracking, and no server upload in v1. |
| Bilingual UI | English and Polish interface from the beginning. |

## Screenshots

The screenshots below are generated from the running local app.

### Dashboard

![SQL Atlas dashboard](public/screenshots/dashboard.png)

### Query Analyzer

![SQL Atlas query analyzer](public/screenshots/query-analyzer.png)

### Index Advisor

![SQL Atlas index advisor](public/screenshots/index-advisor.png)

### Knowledge Base

![SQL Atlas knowledge base](public/screenshots/knowledge-base.png)

### Dialect Compare

![SQL Atlas dialect compare](public/screenshots/dialect-compare.png)

## Example Analysis

Bad SQL:

```sql
SELECT *
FROM customers
WHERE LOWER(email) = 'test@example.com'
ORDER BY created_at DESC;
```

Example output:

- **SELECT \*** detected: selecting every column can increase IO and hide schema coupling.
- **Function on column in WHERE** detected: `LOWER(email)` can prevent a normal index on `email` from being used.
- **ORDER BY without LIMIT** detected: sorting an unbounded result can be expensive.
- **Suggested functional index:**

```sql
CREATE INDEX idx_customers_lower_email
ON customers (LOWER(email));
```

- **Suggested query shape:** select explicit columns, add a safe result bound when only a page or preview is needed, and verify the real plan.

SQL Atlas performs static rule-based analysis. Always verify performance changes with production-like data and `EXPLAIN ANALYZE`.

## Local-first Privacy

SQL Atlas is intentionally not an AI product.

- No AI
- No OpenAI API
- No tracking
- No backend in v1
- No database connection required
- SQL is analyzed locally in the browser

This makes SQL Atlas safe for learning, demos, portfolio work, and public examples. You still should not paste sensitive production queries into random online tools; SQL Atlas simply avoids uploading queries anywhere in the current version.

## Installation

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

## Development Commands

```bash
npm run dev
npm test
npm run build
npm run preview
```

On Windows PowerShell with script execution disabled, use `npm.cmd`:

```bash
npm.cmd install
npm.cmd test
npm.cmd run build
```

## GitHub Pages Deployment

The project is configured for GitHub Pages through GitHub Actions.

1. Push the repository to GitHub.
2. Open `Settings -> Pages`.
3. Set **Build and deployment** to **GitHub Actions**.
4. Push to `main` or `master`.
5. The `Deploy GitHub Pages` workflow builds `dist/` and publishes it.

The Vite base path is computed automatically:

- `milekv.github.io` repositories use `/`.
- Project repositories such as `sql-atlas` use `/sql-atlas/`.
- You can override the base path with `VITE_BASE_PATH`.

SQL Atlas does not use `BrowserRouter`, so refresh handling on GitHub Pages does not require a custom `404.html` fallback.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Monaco Editor
- sql-formatter
- Zod
- Vitest
- GitHub Actions
- GitHub Pages

## Architecture Overview

```text
src/
  app/                    App provider, page state, theme, language, latest analysis
  components/             Layout, SQL editor, UI primitives, copy buttons, code blocks
  features/               Product pages and user-facing workflows
  core/
    analyzer/             Rule-based SQL analyzer and scoring
      rules/              One file per analyzer rule
    index-advisor/        Deterministic index suggestion logic
    dialects/             SQL dialect comparison data
    explain/              PostgreSQL EXPLAIN plan types and sample plan
    report-export/        GitHub-friendly Markdown report generation
  content/                Knowledge topics and anti-pattern content
  i18n/                   English and Polish translation registry
  samples/                Demo SQL samples
  tests/                  Vitest unit tests for rules, indexes, and reports
public/
  logo.svg
  favicon.svg
  screenshots/
    dashboard.png
    query-analyzer.png
    index-advisor.png
    knowledge-base.png
    dialect-compare.png
.github/
  workflows/
    ci.yml                Test and build on push/PR
    pages.yml             Deploy to GitHub Pages
```

## Roadmap

### v0.1.0

- Query Analyzer
- Index Advisor
- SQL Knowledge Base
- Anti-Patterns Library
- Dialect Compare
- Markdown export
- English/Polish support
- GitHub Pages deployment

### v0.2.0

- EXPLAIN JSON Visualizer
- Better PostgreSQL plan analysis
- Visual plan tree

### v0.3.0

- Schema Visualizer
- `CREATE TABLE` parser
- ERD-like relationship view

### v0.4.0

```bash
npx sql-atlas analyze query.sql
```

### v0.5.0

- GitHub Action for checking SQL files in repositories

### Future

- VS Code extension
- More dialect-specific analyzer rules
- More knowledge topics
- Import/export analysis history

## Contributing

Contributions should keep SQL Atlas local-first, deterministic, bilingual, and testable.

1. Install dependencies:

```bash
npm install
```

2. Run checks:

```bash
npm test
npm run build
```

3. When adding an analyzer rule:

- Add the rule in `src/core/analyzer/rules/`.
- Add translation keys in `src/i18n/translations.ts`.
- Add related knowledge topics where useful.
- Add tests in `src/tests/analyzer.test.ts`.
- Keep the rule deterministic and explainable.

4. Open a pull request with a clear description and screenshots when UI changes.

## Polski opis

SQL Atlas to lokalne, dwujęzyczne narzędzie dla developerów pracujących z SQL. Pomaga analizować zapytania, wykrywać antywzorce, sugerować indeksy, porównywać dialekty SQL i uczyć się optymalizacji po angielsku oraz po polsku. Projekt nie używa AI, nie ma backendu i nie wysyła zapytań na serwer.

## Author

**Miłosz Kordziński**  
GitHub: [@milekv](https://github.com/milekv)

## License

MIT. See [LICENSE](LICENSE).
