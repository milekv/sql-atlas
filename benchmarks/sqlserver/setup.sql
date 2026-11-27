-- Run only in a disposable SQL Server database explicitly selected by sqlcmd -d.
IF SCHEMA_ID(N'sql_atlas_bench') IS NULL EXEC(N'CREATE SCHEMA sql_atlas_bench');
GO
IF OBJECT_ID(N'sql_atlas_bench.events', N'U') IS NOT NULL DROP TABLE sql_atlas_bench.events;
CREATE TABLE sql_atlas_bench.events (
  id int NOT NULL PRIMARY KEY,
  occurred_at datetime2(0) NOT NULL,
  payload int NOT NULL
);
WITH digits AS (
  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
), numbers AS (
  SELECT 1 + a.n + 10*b.n + 100*c.n + 1000*d.n + 10000*e.n + 100000*f.n AS n
  FROM digits a CROSS JOIN digits b CROSS JOIN digits c CROSS JOIN digits d
  CROSS JOIN digits e CROSS JOIN digits f
)
INSERT INTO sql_atlas_bench.events (id, occurred_at, payload)
SELECT n, DATEADD(day, n % 1461, CONVERT(datetime2(0), '20230101', 112)), n % 10000
FROM numbers WHERE n <= 200000;
CREATE INDEX events_occurred_at_idx ON sql_atlas_bench.events (occurred_at);
UPDATE STATISTICS sql_atlas_bench.events WITH FULLSCAN;
GO
