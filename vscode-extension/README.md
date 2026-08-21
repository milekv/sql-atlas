# SQL Atlas for VS Code

Find risky and expensive SQL while you type. SQL Atlas marks problems directly in `.sql` files, explains why they matter and suggests a safer direction.

It runs entirely on your machine. No database connection, account, query upload or AI service is required.

## Try it in 30 seconds

1. Open the Command Palette.
2. Run `SQL Atlas: Open Interactive Sample`.
3. Look at the highlighted SQL and open the Problems panel.

Or open any `.sql` file. The status bar shows whether SQL Atlas found anything. Click it to rerun analysis and open the results.

```sql
SELECT *
FROM users
WHERE LOWER(email) LIKE '%@example.com'
ORDER BY RANDOM();
```

SQL Atlas detects issues such as selecting every column, leading wildcard searches, functions that can prevent index use and random sorting on growing tables.

## What you get

- Inline diagnostics with rule IDs and specific suggestions
- A visible status bar result after every analysis
- PostgreSQL, MySQL, SQLite, SQL Server, Oracle and generic SQL support
- Severity filtering for critical, warning and informational findings
- Workspace-level ignored rules
- A Quick Fix for file-level `sql-atlas-ignore` directives
- The same analysis engine available in the browser, CLI and GitHub Action

## Configuration

Open Settings and search for `SQL Atlas`.

| Setting | Purpose | Default |
| --- | --- | --- |
| `sqlAtlas.dialect` | Interpret database-specific syntax correctly | `postgresql` |
| `sqlAtlas.minimumSeverity` | Control which findings appear | `info` |
| `sqlAtlas.ignoreRules` | Disable selected rule IDs in the workspace | `[]` |

To ignore a finding only in the current file, place the cursor on it, select Quick Fix and choose `SQL Atlas: ignore RULE_ID in this file`.

## Privacy and limitations

Analysis is static and local. SQL Atlas does not execute SQL and cannot know your production data distribution or indexes unless that context is supplied elsewhere. Treat findings as review prompts, not as a replacement for `EXPLAIN ANALYZE`.

Source, documentation, CLI and GitHub Action: [github.com/milekv/sql-atlas](https://github.com/milekv/sql-atlas)

Found an incorrect diagnostic? Please open a focused [issue](https://github.com/milekv/sql-atlas/issues) with the smallest reproducible SQL example.
