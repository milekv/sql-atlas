# SQL Atlas for VS Code

SQL Atlas analyzes SQL locally while you edit. It does not send queries to a
server and does not require a database connection.

## Features

- Diagnostics for `.sql` files using the SQL Atlas analyzer
- PostgreSQL, MySQL, SQLite, SQL Server, Oracle and generic SQL dialects
- Configurable minimum severity and ignored rules
- Quick fix to add a file-level `sql-atlas-ignore` directive

Configure the extension under `sqlAtlas.dialect`,
`sqlAtlas.minimumSeverity` and `sqlAtlas.ignoreRules`.

Source, CLI and GitHub Action: https://github.com/milekv/sql-atlas
