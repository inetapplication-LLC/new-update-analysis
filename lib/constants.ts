/* ── Centralized color and display constants ─────────── */

export const SOURCE_COLORS: Record<string, string> = {
  Client: "#7abc64",
  "DRN Hit": "#14b8a6",
  Agent: "#8b5cf6",
  System: "#3b82f6",
};

export const AVATAR_PALETTE = [
  { bg: "#dbeafe", fg: "#1e40af" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#d1fae5", fg: "#065f46" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#ffedd5", fg: "#9a3412" },
  { bg: "#ccfbf1", fg: "#115e59" },
  { bg: "#fae8ff", fg: "#86198f" },
  { bg: "#dcfce7", fg: "#166534" },
] as const;

export const SOURCE_FALLBACK_COLOR = "#94a3b8";

export function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || SOURCE_FALLBACK_COLOR;
}
