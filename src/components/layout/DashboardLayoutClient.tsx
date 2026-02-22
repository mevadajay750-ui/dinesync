"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ROUTES } from "@/lib/constants";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileDrawer } from "./MobileDrawer";
import { PageWrapper } from "./PageWrapper";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayoutClient({ children, title }: DashboardLayoutClientProps) {
  const router = useRouter();
  const { user, firebaseUser, loading, refreshUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  usePushNotifications();

  // When signed in but profile not in context yet (e.g. after invite signup), load it.
  useEffect(() => {
    if (firebaseUser && user == null) {
      void refreshUser();
    }
  }, [firebaseUser, user, refreshUser]);

  // Only redirect to create-organization when we have a loaded profile that has no org.
  useEffect(() => {
    if (loading) return;
    if (user != null && !user.organizationId) {
      router.replace(ROUTES.CREATE_ORGANIZATION);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user == null && firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user != null && !user.organizationId) {
    return null;
  }
  if (!user?.organizationId) {
    return null;
  }

  return (
    <div className="flex h-screen min-h-screen bg-background transition-colors duration-200">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      </div>
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex min-h-0 flex-1 flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} title={title} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <div className="mx-auto max-w-7xl">
            <PageWrapper>{children}</PageWrapper>
          </div>
        </main>
      </div>
    </div>
  );
}
