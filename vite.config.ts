import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrOrgPage = repositoryName.endsWith(".github.io");
const githubPagesBase =
  process.env.GITHUB_PAGES === "true" && repositoryName
    ? isUserOrOrgPage
      ? "/"
      : `/${repositoryName}/`
    : "/";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? githubPagesBase,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("monaco-editor") || id.includes("@monaco-editor")) {
            return "monaco";
          }

          return undefined;
        },
      },
    },
  },
});
