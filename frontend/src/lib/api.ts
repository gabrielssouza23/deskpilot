import type {
  AuthResponse,
  Stats,
  TicketCreated,
  TicketCreateInput,
  TicketDetail,
  TicketFilters,
  TicketPage,
  TicketStatus,
  TicketUpdate,
  User,
} from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

/** Turns FastAPI's `detail` (a string, or a list of validation issues) into one readable line. */
export function errorMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return (detail as ValidationIssue[])
      .map((issue) => {
        const field = issue.loc?.filter((part) => part !== "body").join(".");
        const msg = issue.msg?.replace(/^Value error, /, "") ?? "is invalid";
        return field ? `${field}: ${msg}` : msg;
      })
      .join("; ");
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, errorMessage(body, `Request failed (${response.status})`));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: json({ email, password }) }),
  register: (full_name: string, email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: json({ full_name, email, password }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),

  createTicket: (input: TicketCreateInput) =>
    request<TicketCreated>("/tickets", { method: "POST", body: json(input) }),
  listTickets: (filters: TicketFilters) => request<TicketPage>(`/tickets${toQueryString(filters)}`),
  getTicket: (id: number) => request<TicketDetail>(`/tickets/${id}`),
  updateTicket: (id: number, changes: TicketUpdate) =>
    request<TicketDetail>(`/tickets/${id}`, { method: "PATCH", body: json(changes) }),
  addReply: (id: number, body: string, status?: TicketStatus) =>
    request<TicketDetail>(`/tickets/${id}/replies`, {
      method: "POST",
      body: json({ body, status }),
    }),
  retriage: (id: number) => request<TicketDetail>(`/tickets/${id}/triage`, { method: "POST" }),

  stats: () => request<Stats>("/stats"),
  agents: () => request<User[]>("/users"),
};
