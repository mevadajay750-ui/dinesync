"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Moon, Sun, Menu, LogOut, User } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title = "Dashboard" }: TopbarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, signOut } = useAuth();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded p-2 hover:bg-accent lg:hidden"
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
          className="rounded p-2 hover:bg-accent"
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
        <Button variant="ghost" size="sm" onClick={() => signOut()} leftIcon={<LogOut className="h-4 w-4" />}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
