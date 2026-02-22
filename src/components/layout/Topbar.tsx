"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { Moon, Sun, Menu, LogOut, User } from "lucide-react";

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};
const contentVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.15 },
};

interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title = "Dashboard" }: TopbarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOutClick = () => setLogoutOpen(true);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      setLogoutOpen(false);
      // Full navigation so we leave dashboard before layout can render null
      window.location.href = ROUTES.LOGIN;
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCancelLogout = () => {
    if (!loggingOut) setLogoutOpen(false);
  };

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6 transition-colors duration-200">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-foreground transition-all duration-200 hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold text-foreground">{title}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          {user && (
            <div className="hidden items-center gap-2 sm:flex">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user.name} ({user.role})
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOutClick}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign out
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {logoutOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
          >
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={handleCancelLogout}
              aria-hidden
              {...backdropVariants}
            />
            <motion.div className="relative z-10 w-full max-w-sm" {...contentVariants}>
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle id="logout-dialog-title">Sign out</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to sign out?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelLogout}
                      disabled={loggingOut}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirmLogout}
                      loading={loggingOut}
                    >
                      Yes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
