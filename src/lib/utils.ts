import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const IMAGE_PROXY = "/api/proxy/image";

export function proxyUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  return `${IMAGE_PROXY}?url=${encodeURIComponent(url)}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const READING_STATUSES = [
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
  { value: "plan_to_read", label: "Plan to Read" },
] as const;

export type ReadingStatus = (typeof READING_STATUSES)[number]["value"];
