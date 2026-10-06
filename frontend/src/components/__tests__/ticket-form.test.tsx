import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TicketForm, validateTicket } from "../ticket-form";

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TicketForm />
    </QueryClientProvider>,
  );
}

describe("validateTicket", () => {
  it("accepts a complete ticket", () => {
    expect(
      validateTicket({
        customer_name: "Jane",
        customer_email: "jane@example.com",
        subject: "Help",
        message: "Something is broken",
      }),
    ).toEqual({});
  });
});

describe("TicketForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows validation errors and does not call the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Submit request" }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Please tell us your name.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the ticket and shows the confirmation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: 42, subject: "Refund", status: "open", created_at: "2026-01-01" }),
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderForm();

    await userEvent.type(screen.getByLabelText("Name"), "Jane Doe");
    await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
    await userEvent.type(screen.getByLabelText("Subject"), "Refund");
    await userEvent.type(screen.getByLabelText("How can we help?"), "I was charged twice.");
    await userEvent.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByText("Ticket #42 received")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/tickets");
    expect(JSON.parse(init.body)).toEqual({
      customer_name: "Jane Doe",
      customer_email: "jane@example.com",
      subject: "Refund",
      message: "I was charged twice.",
    });
  });

  it("shows the server error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Service unavailable" }), { status: 503 }),
        ),
    );
    renderForm();

    await userEvent.type(screen.getByLabelText("Name"), "Jane");
    await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
    await userEvent.type(screen.getByLabelText("Subject"), "Help");
    await userEvent.type(screen.getByLabelText("How can we help?"), "Something is broken");
    await userEvent.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
  });
});
