-- id is unique, so EXCEPT both ways proves equality of the full result sets.
WITH a AS (
  SELECT id FROM sql_atlas_bench.events WHERE YEAR(occurred_at) = 2025
), b AS (
  SELECT id FROM sql_atlas_bench.events
  WHERE occurred_at >= CONVERT(datetime2(0), '20250101', 112)
    AND occurred_at < CONVERT(datetime2(0), '20260101', 112)
)
SELECT (SELECT COUNT_BIG(*) FROM a) AS matching_rows,
  (SELECT COUNT_BIG(*) FROM (SELECT id FROM a EXCEPT SELECT id FROM b) missing_from_b) AS missing_from_b,
  (SELECT COUNT_BIG(*) FROM (SELECT id FROM b EXCEPT SELECT id FROM a) missing_from_a) AS missing_from_a;
GO
-- Abort before measuring if either result set differs.
IF EXISTS (
  SELECT id FROM sql_atlas_bench.events WHERE YEAR(occurred_at) = 2025
  EXCEPT SELECT id FROM sql_atlas_bench.events
  WHERE occurred_at >= CONVERT(datetime2(0), '20250101', 112)
    AND occurred_at < CONVERT(datetime2(0), '20260101', 112)
) OR EXISTS (
  SELECT id FROM sql_atlas_bench.events
  WHERE occurred_at >= CONVERT(datetime2(0), '20250101', 112)
    AND occurred_at < CONVERT(datetime2(0), '20260101', 112)
  EXCEPT SELECT id FROM sql_atlas_bench.events WHERE YEAR(occurred_at) = 2025
) THROW 50000, 'Date filter result sets differ', 1;
GO
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
-- Alternate the order across two pairs; capture actual plans separately in SSMS/Azure Data Studio.
SELECT id FROM sql_atlas_bench.events WHERE YEAR(occurred_at) = 2025;
SELECT id FROM sql_atlas_bench.events
WHERE occurred_at >= CONVERT(datetime2(0), '20250101', 112)
  AND occurred_at < CONVERT(datetime2(0), '20260101', 112);
SELECT id FROM sql_atlas_bench.events
WHERE occurred_at >= CONVERT(datetime2(0), '20250101', 112)
  AND occurred_at < CONVERT(datetime2(0), '20260101', 112);
SELECT id FROM sql_atlas_bench.events WHERE YEAR(occurred_at) = 2025;
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
GO
