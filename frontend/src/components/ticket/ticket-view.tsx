"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useTicket } from "@/lib/queries";

import { AiPanel } from "./ai-panel";
import { Conversation } from "./conversation";
import { ReplyComposer } from "./reply-composer";
import { TicketProperties } from "./ticket-properties";

export function TicketView({ id }: { id: number }) {
  const { data: ticket, isPending, error } = useTicket(id);
  const [draft, setDraft] = useState("");

  const backLink = (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <ArrowLeft className="size-4" aria-hidden /> All tickets
    </Link>
  );

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        {backLink}
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !ticket) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="space-y-4">
        {backLink}
        <Alert>
          {notFound ? "This ticket does not exist." : `Could not load ticket: ${error?.message}`}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {backLink}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{ticket.subject}</h1>
          <span className="text-lg text-slate-400">#{ticket.id}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <CategoryBadge category={ticket.category} />
          <span>Opened {formatDateTime(ticket.created_at)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Conversation ticket={ticket} />
          <ReplyComposer ticketId={ticket.id} draft={draft} onDraftChange={setDraft} />
        </div>
        <aside className="space-y-4">
          <AiPanel
            ticket={ticket}
            onUseDraft={(suggestion) => {
              setDraft(suggestion);
              document.getElementById("reply")?.focus();
            }}
          />
          <TicketProperties ticket={ticket} />
        </aside>
      </div>
    </div>
  );
}
