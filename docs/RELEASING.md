# Release procedure

Do not tag or publish from the current work until each item is checked with evidence.

1. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `npm pack --dry-run` and `npm run package:vscode` on a clean checkout.
2. Test the browser analyzer, plan imports, IO/TIME import, PL/EN switching, responsive layout and console in a supported browser. Capture **new actual screenshots** from the built app and a running VS Code extension; replace obsolete images only after visual review.
3. Install the VSIX in VS Code and verify diagnostics, locale setting, commands and quick fix. Run the Action smoke workflow on a test repository or PR and check source line annotations.
4. Run the PostgreSQL benchmark on a disposable database and record version, data, plans and raw timings only if publishing performance claims.
5. Check license notices, dependency audit, Markdown images/links, README examples and Marketplace listing against shipped features. Update package, extension, Action tag and changelog versions together; distinguish already published artifacts from source-only changes.
6. Publish npm and VS Code Marketplace packages, then a GitHub release/tag and Action listing update; verify links and live GitHub Pages after deployment. Set repository description, Topics and Social Preview using [repository presentation](REPOSITORY_PRESENTATION.md).

Release notes should list actual changes, migration steps, tested surfaces, known limitations and artifact versions. There is no 1.0 claim until these gates pass.
