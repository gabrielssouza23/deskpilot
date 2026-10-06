"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { useAddReply } from "@/lib/queries";
import type { TicketStatus } from "@/lib/types";

interface ReplyComposerProps {
  ticketId: number;
  draft: string;
  onDraftChange: (draft: string) => void;
}

type NextStatus = TicketStatus | "keep";

export function ReplyComposer({ ticketId, draft, onDraftChange }: ReplyComposerProps) {
  const [nextStatus, setNextStatus] = useState<NextStatus>("pending");
  const addReply = useAddReply(ticketId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    addReply.mutate(
      { body: draft, status: nextStatus === "keep" ? undefined : nextStatus },
      { onSuccess: () => onDraftChange("") },
    );
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="reply" className="text-sm font-semibold text-slate-900">
          Reply to customer
        </label>
        <Textarea
          id="reply"
          rows={6}
          placeholder="Write a reply, or start from the AI draft on the right…"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        {addReply.isError && <p className="text-sm text-rose-600">{addReply.error.message}</p>}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <label htmlFor="next-status" className="text-sm text-slate-600">
            After sending
          </label>
          <Select
            id="next-status"
            className="sm:w-48"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as NextStatus)}
          >
            <option value="pending">Mark as pending</option>
            <option value="resolved">Mark as resolved</option>
            <option value="keep">Keep status</option>
          </Select>
          <Button type="submit" loading={addReply.isPending} disabled={!draft.trim()}>
            {!addReply.isPending && <Send className="size-4" aria-hidden />}
            Send reply
          </Button>
        </div>
      </form>
    </Card>
  );
}
