import clsx from "clsx";
import type { ReactNode } from "react";

import { CATEGORY_LABELS, PRIORITY_LABELS, SENTIMENT_LABELS, STATUS_LABELS } from "@/lib/format";
import type { Sentiment, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-sky-50 text-sky-700 ring-sky-600/20",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  urgent: "bg-rose-50 text-rose-700 ring-rose-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  medium: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  low: "bg-slate-50 text-slate-600 ring-slate-500/20",
};

const PRIORITY_DOTS: Record<TicketPriority, string> = {
  urgent: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-slate-400",
};

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  neutral: "bg-slate-50 text-slate-600 ring-slate-500/20",
  negative: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge className={PRIORITY_STYLES[priority]}>
      <span className={clsx("size-1.5 rounded-full", PRIORITY_DOTS[priority])} aria-hidden />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <Badge className="bg-violet-50 text-violet-700 ring-violet-600/20">
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return <Badge className={SENTIMENT_STYLES[sentiment]}>{SENTIMENT_LABELS[sentiment]}</Badge>;
}
