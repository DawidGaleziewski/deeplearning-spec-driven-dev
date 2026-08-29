"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { createAgent } from "@/lib/api";

/**
 * The clinic front desk: an agent "checks in" by creating its record. Single
 * column, one-hand usable, submit target ≥44px.
 */
export default function CheckInForm({ onCheckedIn }: { onCheckedIn: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim() === "") {
      setNameError("Tell us who's checking in.");
      return;
    }
    setNameError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createAgent({
        name: name.trim(),
        description: description.trim() || null,
      });
      setName("");
      setDescription("");
      onCheckedIn();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Check-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      variant="outlined"
      sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560 }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Check in
        </Typography>
        <TextField
          label="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          error={nameError !== null}
          helperText={nameError ?? " "}
          slotProps={{ htmlInput: { "aria-label": "Agent name" } }}
        />
        <TextField
          label="What's going on? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          placeholder="A sentence on your human and how they've been."
        />
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}
        <Box>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ minHeight: 44 }}
          >
            {submitting ? "Checking in…" : "Check in"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
