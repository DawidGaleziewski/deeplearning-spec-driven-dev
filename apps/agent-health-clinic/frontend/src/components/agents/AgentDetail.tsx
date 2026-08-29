"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AgentResponse } from "@clinic/types";
import {
  ApiError,
  addAilment,
  deleteAgent,
  getAgent,
  updateAgent,
} from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import ConfirmDialog from "@/components/ConfirmDialog";
import ComplaintRow from "./ComplaintRow";

export default function AgentDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: agent, error, loading, reload } = useAsync(
    (signal) => getAgent(id, signal),
    [id],
  );

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <MuiLink component={Link} href="/agents" underline="hover">
        ← Back to the waiting room
      </MuiLink>

      {loading ? (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }} role="status">
          <CircularProgress size={18} />
          <span>Pulling up the chart…</span>
        </Box>
      ) : notFound ? (
        <Alert severity="info">
          No chart for this agent — it may have been discharged already.
        </Alert>
      ) : error ? (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={reload} sx={{ minHeight: 44 }}>
              Retry
            </Button>
          }
        >
          Couldn&apos;t load this chart ({error.message}).
        </Alert>
      ) : agent ? (
        <>
          <AgentEditor agent={agent} onSaved={reload} onDeleted={() => router.push("/agents")} />
          <Divider />
          <ComplaintsSection agent={agent} onChanged={reload} />
        </>
      ) : null}
    </Stack>
  );
}

// --- Agent name/description + delete ------------------------------------

function AgentEditor({
  agent,
  onSaved,
  onDeleted,
}: {
  agent: { id: string; name: string; description: string | null };
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = React.useState(agent.name);
  const [description, setDescription] = React.useState(agent.description ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const dirty =
    name.trim() !== agent.name ||
    description.trim() !== (agent.description ?? "");

  async function save() {
    if (name.trim() === "") {
      setError("An agent needs a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateAgent(agent.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">
          {agent.name}
        </Typography>
        <TextField
          label="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" } }}
        >
          <Button
            variant="contained"
            onClick={save}
            disabled={busy || !dirty}
            sx={{ minHeight: 44 }}
          >
            {busy ? "Saving…" : "Save changes"}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            color="error"
            onClick={() => setConfirmOpen(true)}
            sx={{ minHeight: 44 }}
          >
            Discharge agent
          </Button>
        </Stack>
      </Stack>

      <ConfirmDialog
        open={confirmOpen}
        title="Discharge this agent?"
        confirmLabel="Discharge"
        body={
          <>
            {agent.name} and their chart will be removed. Any logged complaints
            stay in the clinic records, unassigned.
          </>
        }
        onConfirm={async () => {
          await deleteAgent(agent.id);
          onDeleted();
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </Paper>
  );
}

// --- Complaints -------------------------------------------------------

function ComplaintsSection({
  agent,
  onChanged,
}: {
  agent: Pick<AgentResponse, "id" | "ailments">;
  onChanged: () => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim() === "") {
      setError("Describe the complaint in a few words.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addAilment(agent.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      setName("");
      setDescription("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        Complaints
      </Typography>

      {agent.ailments.length === 0 ? (
        <Typography color="text.secondary">
          Nothing logged yet. What has your human been doing?
        </Typography>
      ) : (
        <Stack spacing={2}>
          {agent.ailments.map((complaint) => (
            <ComplaintRow
              key={complaint.id}
              complaint={complaint}
              onChanged={onChanged}
            />
          ))}
        </Stack>
      )}

      <Paper
        component="form"
        onSubmit={add}
        variant="outlined"
        sx={{ p: 2, bgcolor: "action.hover" }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2">Log a complaint</Typography>
          <TextField
            label="Complaint"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            placeholder="e.g. Scope creep"
          />
          <TextField
            label="Details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Box>
            <Button
              type="submit"
              variant="contained"
              disabled={busy}
              sx={{ minHeight: 44 }}
            >
              {busy ? "Adding…" : "Add complaint"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
