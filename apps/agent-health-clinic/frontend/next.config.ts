import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // `@clinic/types` is a local `file:` package (types only); let the Next
  // bundler resolve its entry points like first-party source.
  transpilePackages: ["@clinic/types"],

  // Emit a self-contained server under `.next/standalone/` so the Docker
  // runtime image can ship the traced server + a pruned `node_modules` instead
  // of the full dependency tree. `next start` is never used in the container.
  output: "standalone",

  // `@clinic/types` lives in a sibling `packages/` directory (one level above
  // `frontend/`). Without a wider trace root Next would root the trace at
  // `frontend/` and drop anything outside it from the standalone layout. The
  // app root covers both `frontend/` and `packages/`.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
