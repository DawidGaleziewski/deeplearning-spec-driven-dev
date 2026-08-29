"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Shared MUI theme. Phase 2 keeps the default MUI palette/typography — the
 * visual pass is Phase 7. What matters here is that `breakpoints` are configured
 * so every later screen has `theme.breakpoints.up(...)` to build on, mobile-first.
 */
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;
