#!/usr/bin/env bash
set -euo pipefail
# Explicit connection string required; never default to an unrelated database.
: "${SQL_ATLAS_BENCH_DSN:?Set SQL_ATLAS_BENCH_DSN to a disposable PostgreSQL database URL}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
psql "$SQL_ATLAS_BENCH_DSN" -X -v ON_ERROR_STOP=1 -f "$script_dir/setup.sql"
psql "$SQL_ATLAS_BENCH_DSN" -X -v ON_ERROR_STOP=1 -f "$script_dir/measure.sql"
