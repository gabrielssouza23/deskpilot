"use client";

import { Loader2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { toQueryString } from "@/lib/api";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, timeAgo } from "@/lib/format";
import { useTickets } from "@/lib/queries";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketFilters,
  type TicketSummary,
} from "@/lib/types";

const PAGE_SIZE = 10;
const SORTS = ["newest", "oldest", "priority"] as const;

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** Filters live in the URL, so a filtered view can be bookmarked or shared. */
export function parseFilters(params: URLSearchParams): TicketFilters {
  const page = Number(params.get("page"));
  return {
    status: oneOf(params.get("status"), TICKET_STATUSES),
    priority: oneOf(params.get("priority"), TICKET_PRIORITIES),
    category: oneOf(params.get("category"), TICKET_CATEGORIES),
    sort: oneOf(params.get("sort"), SORTS),
    q: params.get("q") ?? undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  };
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative flex-1 sm:min-w-64">
      <Search
        className="pointer-events-none absolute top-3 left-3 size-4 text-slate-400"
        aria-hidden
      />
      <Input
        type="search"
        aria-label="Search tickets"
        placeholder="Search subject, message or customer…"
        className="pl-9"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TriagePending() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
      <Loader2 className="size-3 animate-spin" aria-hidden /> AI triage running…
    </span>
  );
}

function TicketRow({ ticket, onOpen }: { ticket: TicketSummary; onOpen: () => void }) {
  return (
    <tr onClick={onOpen} className="cursor-pointer align-top hover:bg-slate-50">
      <td className="max-w-md py-3 pr-3 pl-4">
        <Link
          href={`/dashboard/tickets/${ticket.id}`}
          className="font-medium text-slate-900 hover:text-indigo-600"
          onClick={(event) => event.stopPropagation()}
        >
          {ticket.subject}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
          {ticket.triage_status === "pending" ? <TriagePending /> : ticket.summary}
        </p>
      </td>
      <td className="px-3 py-3 text-sm">
        <p className="text-slate-900">{ticket.customer_name}</p>
        <p className="text-slate-500">{ticket.customer_email}</p>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={ticket.status} />
      </td>
      <td className="px-3 py-3">
        <PriorityBadge priority={ticket.priority} />
      </td>
      <td className="px-3 py-3">
        <CategoryBadge category={ticket.category} />
      </td>
      <td className="px-3 py-3 text-sm text-slate-600">
        {ticket.assignee ? (
          <span className="flex items-center gap-2">
            <Avatar name={ticket.assignee.full_name} className="size-6 text-[10px]" />
            <span className="whitespace-nowrap">{ticket.assignee.full_name}</span>
          </span>
        ) : (
          <span className="text-slate-400">Unassigned</span>
        )}
      </td>
      <td className="py-3 pr-4 pl-3 text-sm whitespace-nowrap text-slate-500">
        {timeAgo(ticket.created_at)}
      </td>
    </tr>
  );
}

function TicketCard({ ticket }: { ticket: TicketSummary }) {
  return (
    <li>
      <Link
        href={`/dashboard/tickets/${ticket.id}`}
        className="block space-y-2 p-4 hover:bg-slate-50"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-slate-900">{ticket.subject}</p>
          <span className="shrink-0 text-xs text-slate-500">{timeAgo(ticket.created_at)}</span>
        </div>
        <p className="line-clamp-2 text-sm text-slate-500">
          {ticket.triage_status === "pending" ? <TriagePending /> : ticket.summary}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <CategoryBadge category={ticket.category} />
        </div>
        <p className="text-xs text-slate-500">
          {ticket.customer_name} · {ticket.assignee?.full_name ?? "Unassigned"}
        </p>
      </Link>
    </li>
  );
}

export function TicketQueue() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [searchText, setSearchText] = useState(filters.q ?? "");

  const { data, isPending, isError, error, isFetching } = useTickets({
    ...filters,
    page_size: PAGE_SIZE,
  });

  const setFilters = useCallback(
    (patch: Partial<TicketFilters>) => {
      // Any filter change sends you back to page 1, unless the patch is the page itself.
      const next = { ...filters, page: undefined, ...patch };
      router.replace(`${pathname}${toQueryString(next)}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    if (searchText === (filters.q ?? "")) return;
    const timer = setTimeout(() => setFilters({ q: searchText || undefined }), 300);
    return () => clearTimeout(timer);
  }, [searchText, filters.q, setFilters]);

  function clearFilters() {
    setSearchText("");
    router.replace(pathname, { scroll: false });
  }

  const page = filters.page ?? 1;
  const hasFilters = Boolean(filters.status || filters.priority || filters.category || filters.q);
  const firstItem = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = data ? Math.min(page * PAGE_SIZE, data.total) : 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <section aria-labelledby="queue-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="queue-heading" className="text-lg font-semibold text-slate-900">
          Ticket queue
        </h2>
        {isFetching && !isPending && (
          <Loader2 className="size-4 animate-spin text-slate-400" aria-label="Refreshing" />
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchBox value={searchText} onChange={setSearchText} />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select
            aria-label="Status"
            value={filters.status ?? ""}
            onChange={(event) => setFilters({ status: oneOf(event.target.value, TICKET_STATUSES) })}
          >
            <option value="">All statuses</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Priority"
            value={filters.priority ?? ""}
            onChange={(event) =>
              setFilters({ priority: oneOf(event.target.value, TICKET_PRIORITIES) })
            }
          >
            <option value="">All priorities</option>
            {TICKET_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Category"
            value={filters.category ?? ""}
            onChange={(event) =>
              setFilters({ category: oneOf(event.target.value, TICKET_CATEGORIES) })
            }
          >
            <option value="">All categories</option>
            {TICKET_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sort by"
            value={filters.sort ?? "newest"}
            onChange={(event) => setFilters({ sort: oneOf(event.target.value, SORTS) })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Highest priority</option>
          </Select>
        </div>
      </div>

      {isError && <Alert>Could not load tickets: {error.message}</Alert>}

      <Card className="overflow-hidden">
        {isPending ? (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading tickets">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="py-3 pr-3 pl-4">
                      Ticket
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Priority
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Assignee
                    </th>
                    <th scope="col" className="py-3 pr-4 pl-3">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      onOpen={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {data.items.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <Sparkles className="size-8 text-slate-300" aria-hidden />
            <p className="text-sm text-slate-600">
              {hasFilters ? "No tickets match these filters." : "The queue is empty. Nice work!"}
            </p>
            {hasFilters && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </Card>

      {data && data.total > 0 && (
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
          <p className="text-slate-600">
            Showing <span className="font-medium">{firstItem}</span>–
            <span className="font-medium">{lastItem}</span> of{" "}
            <span className="font-medium">{data.total}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setFilters({ page: page - 1 > 1 ? page - 1 : undefined })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setFilters({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </section>
  );
}
