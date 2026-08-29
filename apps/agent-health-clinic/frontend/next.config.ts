import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `@clinic/types` is a local `file:` package (types only); let the Next
  // bundler resolve its entry points like first-party source.
  transpilePackages: ["@clinic/types"],
};

export default nextConfig;
