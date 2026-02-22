import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(typeof date === "string" ? new Date(date) : date);
}
