# PostgreSQL date filter benchmark

Run only against a disposable database. `setup.sql` drops and recreates the schema `sql_atlas_bench` and inserts 200,000 deterministic synthetic timestamps. PostgreSQL 14+ and `psql` are required.

```bash
export SQL_ATLAS_BENCH_DSN='postgresql://localhost/sql_atlas_benchmark'
bash ./benchmarks/postgresql/run.sh | tee benchmark-output.txt
```

`measure.sql` first compares the **full multiset of IDs** with `EXCEPT ALL` in both directions and aborts on a mismatch. Then it records two executions of each predicate using `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`. Look at actual duration, buffer reads/hits, returned rows and access paths. Run several times on an otherwise idle instance, record PostgreSQL version, hardware, warm/cold cache and chosen plan. Do not infer a universal speedup; optimizer choices depend on statistics, index selectivity and cache state.

No server PostgreSQL result is committed: this environment does not have a running PostgreSQL server or `psql`. The generated data and queries can be reproduced locally.

### Optional embedded PostgreSQL run

For a real SQL execution without a server, install [PGlite](https://pglite.dev/docs/) into a temporary folder, then run the equivalent 200,000 row scenario under PostgreSQL WASM:

```bash
npm install --prefix /tmp/sql-atlas-bench --no-save @electric-sql/pglite@0.6.0
SQL_ATLAS_PGLITE_MODULE=/tmp/sql-atlas-bench/node_modules/@electric-sql/pglite/dist/index.js \
  node benchmarks/postgresql/run-pglite.mjs > /tmp/sql-atlas-pglite-results.json
```

The script verifies the complete ID multiset with `EXCEPT ALL` both ways, then records three alternating runs per predicate with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`. PGlite is an embedded PostgreSQL WASM build, so its times and buffer behavior are **not** a substitute for measurements on a server deployment. The JSON includes its engine version and actual measurements; no ratio is generalized to production workloads.

An observed run on 2026-11-26 is in [pglite-0.6.0-measurement.json](pglite-0.6.0-measurement.json): 200,000 inserted rows, 49,894 matching IDs, zero mismatches; the expression used a sequential scan and the range used a bitmap heap scan. The three reported PostgreSQL execution times were 51.308/48.589/46.753 ms for `EXTRACT` and 26.153/24.208/25.269 ms for the range. These are the embedded engine's `EXPLAIN ANALYZE` times on the recorded host, with warm in-memory buffers, not a server benchmark or a promised speedup.
