import { build } from "esbuild";

await build({
  entryPoints: ["src/vscode/extension.ts"],
  outfile: "vscode-extension/dist/extension.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["vscode"],
  sourcemap: true,
  minify: false,
  logLevel: "info",
});
