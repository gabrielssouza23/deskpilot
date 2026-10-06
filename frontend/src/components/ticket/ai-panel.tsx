"use client";

import { AlertTriangle, Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Badge, SentimentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { languageName } from "@/lib/format";
import { useRetriage } from "@/lib/queries";
import type { TicketDetail } from "@/lib/types";

function ProviderBadge({ provider }: { provider: string | null }) {
  if (provider === "claude") {
    return <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-600/20">Claude</Badge>;
  }
  return (
    <Badge className="bg-slate-50 text-slate-600 ring-slate-500/20">
      {provider === "rules" ? "Keyword rules" : (provider ?? "Unknown")}
    </Badge>
  );
}

interface AiPanelProps {
  ticket: TicketDetail;
  onUseDraft: (draft: string) => void;
}

export function AiPanel({ ticket, onUseDraft }: AiPanelProps) {
  const retriage = useRetriage(ticket.id);
  const isPending = ticket.triage_status === "pending";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Sparkles className="size-4 text-indigo-500" aria-hidden />
          AI triage
        </h2>
        {!isPending && <ProviderBadge provider={ticket.triage_provider} />}
      </div>

      {isPending ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600" role="status">
          <Loader2 className="size-4 animate-spin text-indigo-500" aria-hidden />
          Reading the ticket and drafting a reply…
        </p>
      ) : ticket.triage_status === "failed" ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Triage failed. Try running it again.
        </p>
      ) : (
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-slate-700">{ticket.summary}</p>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-slate-500">Sentiment</dt>
              <dd className="mt-1">
                <SentimentBadge sentiment={ticket.sentiment} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Language</dt>
              <dd className="mt-1 font-medium text-slate-900">{languageName(ticket.language)}</dd>
            </div>
          </dl>
          {ticket.suggested_reply && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Suggested reply</p>
              <p className="max-h-48 overflow-y-auto rounded-lg bg-slate-50 p-3 whitespace-pre-wrap text-slate-700 ring-1 ring-slate-200">
                {ticket.suggested_reply}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onUseDraft(ticket.suggested_reply ?? "")}
              >
                Use this draft
              </Button>
            </div>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full"
        loading={retriage.isPending}
        disabled={isPending}
        onClick={() => retriage.mutate()}
      >
        {!retriage.isPending && <RefreshCw className="size-4" aria-hidden />}
        Run triage again
      </Button>
      {retriage.isError && <p className="mt-2 text-xs text-rose-600">{retriage.error.message}</p>}
    </Card>
  );
}
