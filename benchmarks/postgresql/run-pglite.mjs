// An optional, no-server run of the date predicate scenario in embedded PostgreSQL WASM.
// Install PGlite separately; it is not a runtime dependency of SQL Atlas.
import { pathToFileURL } from 'node:url';
import os from 'node:os';

const packagePath = process.env.SQL_ATLAS_PGLITE_MODULE;
if (!packagePath) throw new Error('Set SQL_ATLAS_PGLITE_MODULE to the installed PGlite dist/index.js path.');
const { PGlite } = await import(pathToFileURL(packagePath).href);
const db = new PGlite();
const expression = "SELECT id FROM events WHERE EXTRACT(YEAR FROM occurred_at) = 2025";
const range = "SELECT id FROM events WHERE occurred_at >= timestamp '2025-01-01' AND occurred_at < timestamp '2026-01-01'";
const version = (await db.query('SELECT version()')).rows[0].version;

try {
  await db.exec(`CREATE TABLE events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at timestamp NOT NULL, payload integer NOT NULL);
    SELECT setseed(0.417);
    INSERT INTO events (occurred_at, payload)
    SELECT timestamp '2023-01-01' + (random() * interval '1461 days'), (random() * 10000)::integer
    FROM generate_series(1, 200000);
    CREATE INDEX events_occurred_at_idx ON events (occurred_at);
    ANALYZE events;`);
  const check = (await db.query(`WITH a AS (${expression}), b AS (${range}),
    mismatch AS ((SELECT id FROM a EXCEPT ALL SELECT id FROM b)
      UNION ALL (SELECT id FROM b EXCEPT ALL SELECT id FROM a))
    SELECT (SELECT count(*) FROM a)::integer AS matching_rows,
      (SELECT count(*) FROM mismatch)::integer AS mismatches`)).rows[0];
  if (check.mismatches !== 0) throw new Error(`Result mismatch: ${check.mismatches}`);

  const runs = [];
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const [predicate, sql] of repeat % 2 ? [['range', range], ['extract', expression]] : [['extract', expression], ['range', range]]) {
      const row = (await db.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`)).rows[0];
      const plan = row['QUERY PLAN'][0];
      runs.push({ predicate, repeat: repeat + 1, executionTimeMs: plan['Execution Time'],
        actualRows: plan.Plan['Actual Rows'], nodeType: plan.Plan['Node Type'],
        sharedHitBlocks: plan.Plan['Shared Hit Blocks'], sharedReadBlocks: plan.Plan['Shared Read Blocks'] });
    }
  }
  console.log(JSON.stringify({ engine: version, environment: 'PGlite embedded PostgreSQL WASM, in-memory',
    host: { platform: process.platform, arch: process.arch, node: process.version, cpu: os.cpus()[0]?.model },
    rowsInserted: 200000, matchingRows: check.matching_rows, mismatches: check.mismatches, runs }, null, 2));
} finally {
  await db.close();
}
