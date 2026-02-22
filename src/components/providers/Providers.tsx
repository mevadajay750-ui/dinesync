"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
