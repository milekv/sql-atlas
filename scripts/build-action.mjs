import { build } from "esbuild";

await build({
  entryPoints: ["src/action/index.ts"],
  outfile: "dist-action/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  minify: true,
  sourcemap: false,
  legalComments: "none",
});
