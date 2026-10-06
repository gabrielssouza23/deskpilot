"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import type { TicketDetail, TicketFilters, TicketStatus, TicketUpdate } from "./types";

export const queryKeys = {
  me: ["me"] as const,
  agents: ["agents"] as const,
  stats: ["stats"] as const,
  tickets: (filters: TicketFilters) => ["tickets", filters] as const,
  ticket: (id: number) => ["ticket", id] as const,
};

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: api.me, staleTime: 5 * 60_000 });
}

export function useAgents() {
  return useQuery({ queryKey: queryKeys.agents, queryFn: api.agents, staleTime: 5 * 60_000 });
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: api.stats });
}

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: queryKeys.tickets(filters),
    queryFn: () => api.listTickets(filters),
    // Keep showing the current page while the next one loads, so the table doesn't flash.
    placeholderData: keepPreviousData,
    // New tickets are triaged in the background; poll until every visible one is done.
    refetchInterval: (query) =>
      query.state.data?.items.some((ticket) => ticket.triage_status === "pending") ? 2000 : false,
  });
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: queryKeys.ticket(id),
    queryFn: () => api.getTicket(id),
    refetchInterval: (query) => (query.state.data?.triage_status === "pending" ? 1500 : false),
  });
}

/** Shared by every ticket mutation: put the fresh ticket in the cache and refresh lists. */
function useTicketMutation<TVariables>(
  id: number,
  mutationFn: (variables: TVariables) => Promise<TicketDetail>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (ticket) => {
      queryClient.setQueryData(queryKeys.ticket(id), ticket);
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useUpdateTicket(id: number) {
  return useTicketMutation(id, (changes: TicketUpdate) => api.updateTicket(id, changes));
}

export function useAddReply(id: number) {
  return useTicketMutation(id, ({ body, status }: { body: string; status?: TicketStatus }) =>
    api.addReply(id, body, status),
  );
}

export function useRetriage(id: number) {
  return useTicketMutation(id, () => api.retriage(id));
}
