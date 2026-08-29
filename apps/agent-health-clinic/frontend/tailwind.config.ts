import type { Config } from "tailwindcss";

/**
 * Tailwind is used for spacing/layout utilities only. `preflight` is disabled so
 * Tailwind's CSS reset does not fight MUI's `CssBaseline` (see specs/tech-stack.md#ui).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
