import clsx from "clsx";

import { Avatar } from "@/components/ui/avatar";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { TicketDetail } from "@/lib/types";

interface MessageProps {
  author: string;
  meta?: string;
  createdAt: string;
  body: string;
  fromAgent?: boolean;
}

function Message({ author, meta, createdAt, body, fromAgent = false }: MessageProps) {
  return (
    <li className="flex gap-3">
      <Avatar
        name={author}
        className={clsx("size-9", fromAgent ? "" : "bg-slate-200 text-slate-700")}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-slate-900">{author}</span>
          {meta && <span className="text-sm text-slate-500">{meta}</span>}
          <time
            dateTime={createdAt}
            title={formatDateTime(createdAt)}
            className="text-xs text-slate-400"
          >
            {timeAgo(createdAt)}
          </time>
        </div>
        <div
          className={clsx(
            "mt-2 rounded-xl px-4 py-3 text-sm leading-6 break-words whitespace-pre-wrap",
            fromAgent
              ? "bg-indigo-50 text-slate-800 ring-1 ring-indigo-100"
              : "bg-white text-slate-800 ring-1 ring-slate-200",
          )}
        >
          {body}
        </div>
      </div>
    </li>
  );
}

export function Conversation({ ticket }: { ticket: TicketDetail }) {
  return (
    <ol className="space-y-6" aria-label="Conversation">
      <Message
        author={ticket.customer_name}
        meta={ticket.customer_email}
        createdAt={ticket.created_at}
        body={ticket.message}
      />
      {ticket.replies.map((reply) => (
        <Message
          key={reply.id}
          author={reply.author?.full_name ?? "Support"}
          meta="Agent"
          createdAt={reply.created_at}
          body={reply.body}
          fromAgent
        />
      ))}
    </ol>
  );
}
