"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { AilmentResponse } from "@clinic/types";
import { deleteAilment, updateAilment } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * One complaint on an agent's chart: read view with edit/delete, an inline edit
 * form, and the read-only list of therapies the clinic recommends for it.
 */
export default function ComplaintRow({
  complaint,
  onChanged,
}: {
  complaint: AilmentResponse;
  onChanged: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(complaint.name);
  const [description, setDescription] = React.useState(
    complaint.description ?? "",
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  function startEditing() {
    setName(complaint.name);
    setDescription(complaint.description ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (name.trim() === "") {
      setError("A complaint needs a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateAilment(complaint.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await deleteAilment(complaint.id);
    onChanged();
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {editing ? (
        <Stack spacing={2}>
          <TextField
            label="Complaint"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
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
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={save}
              disabled={busy}
              sx={{ minHeight: 44 }}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button
              onClick={() => setEditing(false)}
              disabled={busy}
              sx={{ minHeight: 44 }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {complaint.name}
          </Typography>
          {complaint.description ? (
            <Typography color="text.secondary">
              {complaint.description}
            </Typography>
          ) : null}
          {complaint.recommendedTherapies.length > 0 ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                Recommended:
              </Typography>
              {complaint.recommendedTherapies.map((t) => (
                <Chip key={t.id} label={t.name} size="small" variant="outlined" />
              ))}
            </Box>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Button size="small" onClick={startEditing} sx={{ minHeight: 44 }}>
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => setConfirmOpen(true)}
              sx={{ minHeight: 44 }}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this complaint?"
        body={`"${complaint.name}" will be removed from the chart.`}
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </Paper>
  );
}
