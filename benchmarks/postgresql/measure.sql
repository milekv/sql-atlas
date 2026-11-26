\set ON_ERROR_STOP on
\timing on
-- Verify bag equivalence including multiplicity before measuring. Both filters use
-- the same half-open interval semantics for timestamp without time zone.
WITH a AS (
  SELECT id FROM sql_atlas_bench.events WHERE EXTRACT(YEAR FROM occurred_at) = 2025
), b AS (
  SELECT id FROM sql_atlas_bench.events
  WHERE occurred_at >= timestamp '2025-01-01' AND occurred_at < timestamp '2026-01-01'
), mismatch AS (
  (SELECT id FROM a EXCEPT ALL SELECT id FROM b)
  UNION ALL
  (SELECT id FROM b EXCEPT ALL SELECT id FROM a)
)
SELECT CASE WHEN EXISTS (SELECT 1 FROM mismatch)
  THEN 1 / 0 ELSE (SELECT count(*) FROM a) END AS verified_matching_rows;

-- Compare repeated runs; the first may include cold-cache effects.
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id FROM sql_atlas_bench.events WHERE EXTRACT(YEAR FROM occurred_at) = 2025;
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id FROM sql_atlas_bench.events
WHERE occurred_at >= timestamp '2025-01-01' AND occurred_at < timestamp '2026-01-01';
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id FROM sql_atlas_bench.events WHERE EXTRACT(YEAR FROM occurred_at) = 2025;
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id FROM sql_atlas_bench.events
WHERE occurred_at >= timestamp '2025-01-01' AND occurred_at < timestamp '2026-01-01';
