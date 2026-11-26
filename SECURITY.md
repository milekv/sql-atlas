# Security

SQL Atlas runs deterministic analysis locally. It does not need database credentials or an analysis API. SQL and execution plans can contain sensitive identifiers, literals or customer information. Remove secrets before attaching samples to public issues. Avoid using production DML with `EXPLAIN ANALYZE` or `SET STATISTICS XML`, since those commands execute SQL.

For a vulnerability in SQL Atlas, use [GitHub's private vulnerability reporting](https://github.com/milekv/sql-atlas/security/advisories/new) if enabled; otherwise contact the maintainer privately through the GitHub profile instead of posting exploit details in a public issue. Include affected version, a minimal reproduction and impact. Do not send live database credentials.

Supported versions: the latest published release and the active development branch receive best-effort security fixes. This document is not a promise of a response SLA. Imported Showplan XML is bounded and rejects DTDs; report bypasses or denial-of-service cases privately.
