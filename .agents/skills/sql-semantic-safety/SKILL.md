---
name: sql-semantic-safety
description: Review SQL rewrites and quick fixes for semantic equivalence and destructive-operation safety. Use for rewrite rules and suggested SQL.
---

# Rewrite workflow

Identify the exact claim a rewrite makes. Compare NULL behavior, duplicates, collation, implicit casts, date and time behavior, ordering, and dialect syntax. Test on isolated fixtures with both matching and counterexample cases. Never execute destructive SQL on production data. If equivalence is uncertain, present an explanation and a candidate for manual review instead of an automatic fix. A passing fixture cannot prove equivalence for all inputs.
