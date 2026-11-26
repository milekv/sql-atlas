# CLI and GitHub Action

The CLI accepts a file, a glob or `-` for standard input. Use `--dialect postgresql|mysql|oracle|sqlite|sqlserver|generic`, `--format text|json|markdown|sarif`, `--language en|pl` in the current source, `--ignore id1,id2`, `--config sql-atlas.json`, `--fail-on critical|warning|info` and `--min-score 0..100`. Run `node dist-cli/sql-atlas.js --help` after `npm run build:cli` for the exact installed syntax.

```bash
node dist-cli/sql-atlas.js analyze examples/safe-query.sql --dialect postgresql --language pl --format json
```

Config example:

```json
{ "rules": { "possible-n-plus-one-pattern": "off" } }
```

A file directive `-- sql-atlas-ignore rule-id` excludes that rule for that file. The Action's `paths`, `dialect`, `language`, `config`, `ignore`, `fail-on` and `min-score` inputs are in [action.yml](../action.yml). `fail-on` is a policy, not a proof that SQL passing the gate is safe. CI examples in both READMEs pin the currently published `v0.8.0` tag; changes in this source branch are not available at that tag until a new release.
