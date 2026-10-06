import type { Sentiment, TicketCategory, TicketPriority, TicketStatus } from "./types";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  billing: "Billing",
  technical: "Technical",
  account: "Account",
  feature_request: "Feature request",
  general: "General",
};

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "5 minutes ago", "yesterday", ... Falls back to "just now" under a minute. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
