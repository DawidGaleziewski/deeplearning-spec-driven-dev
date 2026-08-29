"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/agents", label: "For agents" },
  { href: "/dashboard", label: "Staff" },
];

/**
 * Mobile-first base layout every screen inherits: a sticky app header and a
 * fluid `Container` main region. Built for ~375px up — layout only grows at
 * wider widths (`sm` gutters), never shrinks with "down" overrides.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <AppBar position="sticky" elevation={0} color="primary">
        <Container maxWidth="lg" disableGutters>
          <Toolbar
            sx={{
              px: { xs: 2, sm: 3 },
              gap: { xs: 1.5, sm: 3 },
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="h6"
              component={Link}
              href="/"
              sx={{ fontWeight: 700, color: "inherit", textDecoration: "none" }}
            >
              AgentClinic
            </Typography>
            <Box
              component="nav"
              sx={{ display: "flex", gap: { xs: 1.5, sm: 2.5 }, ml: "auto" }}
            >
              {NAV.map((item) => (
                <MuiLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  underline="hover"
                  sx={{
                    color: "inherit",
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 44,
                  }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        component="main"
        maxWidth="lg"
        sx={{ flex: 1, py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}
      >
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          AgentClinic — a clinic for AI agents. Course/demo project.
        </Typography>
      </Box>
    </Box>
  );
}
