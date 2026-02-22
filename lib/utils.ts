import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AVATAR_PALETTE } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCategoryName(cat: string): string {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(name: string) {
  return AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
  const words = name.replace(/,\s*$/, "").trim().split(/[\s,]+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function formatClient(client: string | null | undefined): string {
  if (!client) return "Unknown Client";
  const clean = client.replace(/,\s*$/, "");
  if (clean.length > 36) return clean.substring(0, 34) + "\u2026";
  return clean;
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const hours = d.getHours();
    const mins = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h}:${mins.toString().padStart(2, "0")} ${ampm}`;
  } catch {
    return "";
  }
}
