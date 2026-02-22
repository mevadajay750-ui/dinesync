"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back, {user.name}</h2>
        <p className="text-muted-foreground">
          {orgLoading ? "Loading..." : organization ? organization.name : "Your organization"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href={ROUTES.DASHBOARD_ORDERS}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Orders today
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Protected route example</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Menu items</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <CardDescription>Add your menu to get started</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <CardDescription>Reports coming soon</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Role</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{user.role}</p>
            <CardDescription>Your current role</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>This is a protected dashboard. Only authenticated users can see this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            <li>Navigate using the sidebar (collapsible on desktop, drawer on mobile).</li>
            <li>Use the top bar to toggle dark mode and sign out.</li>
            <li>Tables, Menu, Orders, Kitchen, Reports, and Settings are ready for your features.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
