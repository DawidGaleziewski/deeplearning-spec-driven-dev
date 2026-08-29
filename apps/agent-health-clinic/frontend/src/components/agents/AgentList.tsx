"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AgentResponse } from "@clinic/types";

function complaintSummary(agent: AgentResponse): string {
  const n = agent.ailments.length;
  if (n === 0) return "No complaints logged";
  const names = agent.ailments.map((a) => a.name).join(", ");
  return n === 1 ? names : `${n} complaints — ${names}`;
}

/**
 * Stacked cards from `xs`; a denser table from `md` up. The switch is additive
 * (`display` toggled per breakpoint), never a "down" override.
 */
export default function AgentList({ agents }: { agents: AgentResponse[] }) {
  const router = useRouter();
  return (
    <>
      {/* Mobile / tablet: cards */}
      <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
        {agents.map((agent) => (
          <Card key={agent.id} variant="outlined">
            <CardActionArea component={Link} href={`/agents/${agent.id}`}>
              <CardContent>
                <Typography variant="h6" component="h3">
                  {agent.name}
                </Typography>
                {agent.description ? (
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {agent.description}
                  </Typography>
                ) : null}
                <Box
                  sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}
                >
                  {agent.ailments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No complaints logged yet.
                    </Typography>
                  ) : (
                    agent.ailments.map((a) => (
                      <Chip key={a.id} label={a.name} size="small" />
                    ))
                  )}
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>

      {/* Desktop: table */}
      <TableContainer
        sx={{ display: { xs: "none", md: "block" }, maxWidth: "100%" }}
      >
        <Table aria-label="Checked-in agents">
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Complaints</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.map((agent) => (
              <TableRow
                key={agent.id}
                hover
                onClick={() => router.push(`/agents/${agent.id}`)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <MuiLink
                    component={Link}
                    href={`/agents/${agent.id}`}
                    underline="hover"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ fontWeight: 600 }}
                  >
                    {agent.name}
                  </MuiLink>
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>
                  {agent.description ?? "—"}
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>
                  {complaintSummary(agent)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
