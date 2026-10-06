// Mirrors the Pydantic schemas in backend/app/schemas.py

export const TICKET_STATUSES = ["open", "pending", "resolved", "closed"] as const;
export const TICKET_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export const TICKET_CATEGORIES = [
  "billing",
  "technical",
  "account",
  "feature_request",
  "general",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type Sentiment = "positive" | "neutral" | "negative";
export type TriageStatus = "pending" | "done" | "failed";

export interface User {
  id: number;
  email: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TicketCreateInput {
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
}

export interface TicketCreated {
  id: number;
  subject: string;
  status: TicketStatus;
  created_at: string;
}

export interface TicketSummary {
  id: number;
  subject: string;
  customer_name: string;
  customer_email: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  sentiment: Sentiment;
  summary: string | null;
  triage_status: TriageStatus;
  assignee: User | null;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: number;
  body: string;
  author: User | null;
  created_at: string;
}

export interface TicketDetail extends TicketSummary {
  message: string;
  language: string;
  suggested_reply: string | null;
  triage_provider: string | null;
  replies: Reply[];
}

export interface TicketPage {
  items: TicketSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  q?: string;
  sort?: "newest" | "oldest" | "priority";
  page?: number;
  page_size?: number;
}

export interface TicketUpdate {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignee_id?: number | null;
}

export interface Stats {
  total: number;
  unassigned_open: number;
  by_status: Record<TicketStatus, number>;
  by_priority: Record<TicketPriority, number>;
  by_category: Record<TicketCategory, number>;
  by_sentiment: Record<Sentiment, number>;
}
