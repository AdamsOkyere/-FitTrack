import { AppShell } from "@/components/app-shell";

export default function TrackedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
