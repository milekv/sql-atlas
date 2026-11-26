---
name: sql-performance-engineering
description: Review query plans, indexes, row estimates and performance recommendations in SQL Atlas. Use for plan parsers and index advice.
---

# Performance workflow

Identify the database engine and version before interpreting a plan. Distinguish estimated from actual rows, time, reads, and operator cost. An operator name alone does not prove a performance problem. Verify recommendations with representative data and an appropriate execution plan. Check existing indexes, selectivity, predicates, and write overhead before suggesting a new index. Keep fixtures with plan provenance and never invent benchmark gains.
