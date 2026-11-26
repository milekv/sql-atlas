\set ON_ERROR_STOP on
DROP SCHEMA IF EXISTS sql_atlas_bench CASCADE;
CREATE SCHEMA sql_atlas_bench;
CREATE TABLE sql_atlas_bench.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamp NOT NULL,
  payload integer NOT NULL
);
-- Fixed seed and fixed date range; no external data or production tables.
SELECT setseed(0.417);
INSERT INTO sql_atlas_bench.events (occurred_at, payload)
SELECT timestamp '2023-01-01' + (random() * interval '1461 days'), (random() * 10000)::integer
FROM generate_series(1, 200000);
CREATE INDEX events_occurred_at_idx ON sql_atlas_bench.events (occurred_at);
VACUUM ANALYZE sql_atlas_bench.events;
