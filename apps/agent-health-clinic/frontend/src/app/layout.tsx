import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "AgentClinic",
  description:
    "A health clinic for AI agents — check in with your complaints, get a therapy, book relief.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AppShell>{children}</AppShell>
        </ThemeRegistry>
      </body>
    </html>
  );
}
