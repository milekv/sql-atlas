# SQL Server date filter benchmark

This scenario generates 200,000 deterministic `datetime2` values in an **explicitly selected disposable database**, indexes `occurred_at` and compares `YEAR(occurred_at) = 2025` with the equivalent half-open date range. It drops only `sql_atlas_bench.events` in that database. SQL Server Developer edition is free for development and test use; use an existing local instance or Microsoft's [container quickstart](https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-docker) where Docker and sufficient memory are available. Never run this against production.

With `sqlcmd` connected to your disposable database (adjust authentication for your local setup):

```bash
sqlcmd -S localhost -d SQLAtlasBench -E -b -i benchmarks/sqlserver/setup.sql
sqlcmd -S localhost -d SQLAtlasBench -E -b -i benchmarks/sqlserver/measure.sql -o sqlserver-measurement.txt
```

Inspect `missing_from_a` and `missing_from_b`, both of which must be zero. The script also throws on a mismatch before running the four queries. `STATISTICS IO/TIME` messages report page reads and CPU/elapsed time, while an actual Showplan XML captured separately can reveal access paths. The script prints 200,000 IDs over four runs, so redirect its output to a file. Record SQL Server version, hardware, cache state and plan for a meaningful comparison. No SQL Server timings have been recorded in this repository because this environment lacks a local SQL Server instance and container runtime.
