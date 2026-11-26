# Roadmap

This is an engineering sequence, not a promise of release dates.

- **P0 accuracy and localization:** complete a page-by-page PL/EN review, test more real dialect constructs, improve clause scope and remove false-positive recommendations. Monaco, VS Code language selection and selected repeated occurrences are implemented in source.
- **P1 SQL Server:** extend Showplan statement/operator coverage using licensed real plans; validate parallelism, adaptive operators, spills and cardinality interpretation across versions. Showplan and IO/TIME import exist in source, but require browser and database validation.
- **P2 benchmark and dialect work:** run the checked-in PostgreSQL benchmark and report exact environment/results; add focused parsing for high-risk Oracle/PG/T-SQL constructs. Implement DBMS_XPLAN import only with a real fixture and documented limitations.
- **Release readiness:** capture current, genuine app/VS Code screenshots; verify browser flows, accessibility, VSIX, npm tarball and Action smoke test; sync package versions; publish only after quality gates.

See [status](docs/IMPLEMENTATION_STATUS.md) for confirmed checks and unresolved risks.
