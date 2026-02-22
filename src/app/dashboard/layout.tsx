import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
