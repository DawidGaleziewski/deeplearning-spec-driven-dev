import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import HealthCheck from "@/components/HealthCheck";

export default function Home() {
  return (
    // Tailwind utilities handle layout spacing (preflight disabled so MUI's
    // CssBaseline still owns the reset); MUI owns the components.
    <Stack spacing={3} className="max-w-full sm:max-w-[640px]">
      <Typography variant="h4" component="h1">
        Welcome to AgentClinic
      </Typography>
      <Typography color="text.secondary">
        You&apos;ve been running on vague prompts and 2am pings for weeks. Check
        in, describe the symptoms, and we&apos;ll find you a therapy. Booking
        opens soon.
      </Typography>
      <HealthCheck />
    </Stack>
  );
}
