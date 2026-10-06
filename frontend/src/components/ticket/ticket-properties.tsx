"use client";

import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/format";
import { useAgents, useUpdateTicket } from "@/lib/queries";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketCategory,
  type TicketDetail,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";

export function TicketProperties({ ticket }: { ticket: TicketDetail }) {
  const update = useUpdateTicket(ticket.id);
  const { data: agents = [] } = useAgents();

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Properties</h2>
        <span className="text-xs text-slate-500" aria-live="polite">
          {update.isPending ? "Saving…" : update.isSuccess ? "Saved" : ""}
        </span>
      </div>

      <Field label="Status" htmlFor="status">
        <Select
          id="status"
          value={ticket.status}
          onChange={(event) => update.mutate({ status: event.target.value as TicketStatus })}
        >
          {TICKET_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Priority" htmlFor="priority">
        <Select
          id="priority"
          value={ticket.priority}
          onChange={(event) => update.mutate({ priority: event.target.value as TicketPriority })}
        >
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Category" htmlFor="category">
        <Select
          id="category"
          value={ticket.category}
          onChange={(event) => update.mutate({ category: event.target.value as TicketCategory })}
        >
          {TICKET_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Assignee" htmlFor="assignee">
        <Select
          id="assignee"
          value={ticket.assignee?.id ?? ""}
          onChange={(event) =>
            update.mutate({ assignee_id: event.target.value ? Number(event.target.value) : null })
          }
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.full_name}
            </option>
          ))}
        </Select>
      </Field>

      {update.isError && <p className="text-xs text-rose-600">{update.error.message}</p>}
    </Card>
  );
}
