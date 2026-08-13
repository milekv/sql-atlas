import { chmod, rm } from "node:fs/promises";
import { build } from "esbuild";

const outfile = "dist-cli/sql-atlas.js";

await rm("dist-cli", { recursive: true, force: true });

await build({
  entryPoints: ["src/cli/bin.ts"],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  banner: { js: "#!/usr/bin/env node" },
  sourcemap: false,
  legalComments: "none",
});

await chmod(outfile, 0o755);
