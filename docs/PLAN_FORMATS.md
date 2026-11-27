# Execution plan inputs

## PostgreSQL

Use `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` on a **read-only** query in a safe environment, then paste the resulting JSON into the EXPLAIN view. `ANALYZE` executes the statement. The viewer reads plan nodes, actual/estimated rows and buffers; the analyzer does not connect to PostgreSQL.

## SQL Server

Import a `.sqlplan`/XML file with the Microsoft Showplan namespace `http://schemas.microsoft.com/sqlserver/2004/07/showplan`. The parser supports `StmtSimple` trees; it keeps estimated row counts and subtree costs separate from actual per-thread counters. `Parallel="true"` describes the compiled operator; the degree of parallelism is read from `QueryPlan`. A plan may omit runtime counters on some nodes. Actual rows and executions shown in the detail panel are sums of *reported* worker counters, not a per-execution normalized value. Duration fields are per-thread and must not be summed into a query duration. Memory amounts in Showplan are in KB.

The reader has a 2 MB text limit and rejects DTD/entity declarations, foreign namespaces, malformed XML, excessively deep trees and excessive element/operator counts. It displays SQL text/object names only in the local browser. It does not currently support every statement class, warning type, XML schema version or embedded function plan. See the [Microsoft Showplan operator reference](https://learn.microsoft.com/en-us/sql/relational-databases/showplan-logical-and-physical-operators-reference) and [SET SHOWPLAN_XML](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-showplan-xml-transact-sql).

The checked-in Microsoft samples [fast](../examples/plans/microsoft-compare1-fast.sqlplan) and [slow](../examples/plans/microsoft-compare1-slow.sqlplan) contain 27 and 34 operators respectively, with reported runtime counters. The file labels come from the source demo; their `QueryHash` differs. The comparison panel flags this and reports observed structure/estimates without claiming a measured speedup. Their source and MIT notice are in [third-party notices](THIRD_PARTY_NOTICES.md). Smaller synthetic cases cover parallel workers, spills and invalid inputs.

Paste messages produced by `SET STATISTICS IO ON` and `SET STATISTICS TIME ON` into the separate measurements field. The parser extracts table scan count, logical/physical/read-ahead/page-server/LOB reads and compile/execution CPU/elapsed milliseconds where present. It does not merge tables from different statements or assume that messages correspond to an imported plan. SQL Server can report multiple entries for the same table. See [STATISTICS IO](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-statistics-io-transact-sql) and [STATISTICS TIME](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-statistics-time-transact-sql).

To capture an **estimated** plan without executing the query, use `SET SHOWPLAN_XML ON` in its own batch, followed by the query in another batch, then `SET SHOWPLAN_XML OFF`. For an actual plan, `SET STATISTICS XML ON` executes the query; avoid destructive statements and use a test database. SQL Atlas never executes the imported SQL.

## Oracle

Paste or open one text table produced by `DBMS_XPLAN.DISPLAY` (estimated plan) or `DBMS_XPLAN.DISPLAY_CURSOR` (cursor plan). The reader accepts the common `BASIC`/`TYPICAL` columns plus `ALLSTATS LAST` columns, retaining operation hierarchy, object names, estimated and actual rows, starts, buffers, reads, elapsed operator time, predicates and notes. It does not connect to Oracle or execute SQL. It rejects multiple plan tables in one input so counters and predicates cannot be attributed to the wrong statement. The input limit is 2 MB.

For `DISPLAY_CURSOR`, actual counters require plan statistics collection (for example `gather_plan_statistics`) and the relevant format options; absent counters remain unknown. `ALLSTATS LAST` describes the last execution when available; `A-Rows` can aggregate rows over starts, while `E-Rows` is the optimizer estimate and may be per start. Cost is an optimizer estimate, not elapsed time. The reader does not infer a bottleneck or an index recommendation from cost alone. See Oracle's [DBMS_XPLAN package reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_XPLAN.html) and [Optimizer Statistics Concepts](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/optimizer-statistics-concepts.html). It does not yet handle XML plans, every optional column or compare different cursor children.
