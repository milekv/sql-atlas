# PostgreSQL date filter benchmark

Run only against a disposable database. `setup.sql` drops and recreates the schema `sql_atlas_bench` and inserts 200,000 deterministic synthetic timestamps. PostgreSQL 14+ and `psql` are required.

```bash
export SQL_ATLAS_BENCH_DSN='postgresql://localhost/sql_atlas_benchmark'
./benchmarks/postgresql/run.sh | tee benchmark-output.txt
```

`measure.sql` first compares the **full multiset of IDs** with `EXCEPT ALL` in both directions and aborts on a mismatch. Then it records two executions of each predicate using `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`. Look at actual duration, buffer reads/hits, returned rows and access paths. Run several times on an otherwise idle instance, record PostgreSQL version, hardware, warm/cold cache and chosen plan. Do not infer a universal speedup; optimizer choices depend on statistics, index selectivity and cache state.

No result is committed: this environment does not have a running PostgreSQL server or `psql`. The generated data and queries can be reproduced locally.
