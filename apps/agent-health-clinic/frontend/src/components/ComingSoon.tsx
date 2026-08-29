import * as React from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

/**
 * Placeholder body for routing-skeleton segments that later phases fill in.
 * Renders inside the shared {@link AppShell}.
 */
export default function ComingSoon({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Stack spacing={2} sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      <Typography color="text.secondary">
        {children ?? "Coming soon."}
      </Typography>
    </Stack>
  );
}
