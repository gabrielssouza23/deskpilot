import { afterEach, describe, expect, it, vi } from "vitest";

import { api, ApiError, errorMessage, toQueryString } from "../api";

describe("errorMessage", () => {
  it("returns FastAPI string details as-is", () => {
    expect(errorMessage({ detail: "Ticket not found" }, "fallback")).toBe("Ticket not found");
  });

  it("joins validation issues with their field names", () => {
    const body = {
      detail: [
        { loc: ["body", "customer_email"], msg: "value is not a valid email address" },
        { loc: ["body", "message"], msg: "Value error, too short" },
      ],
    };
    expect(errorMessage(body, "fallback")).toBe(
      "customer_email: value is not a valid email address; message: too short",
    );
  });

  it("uses the fallback for unexpected bodies", () => {
    expect(errorMessage(null, "Request failed")).toBe("Request failed");
    expect(errorMessage({ detail: [] }, "Request failed")).toBe("Request failed");
  });
});

describe("toQueryString", () => {
  it("skips empty values", () => {
    expect(toQueryString({ status: "open", q: "", page: undefined, page_size: 10 })).toBe(
      "?status=open&page_size=10",
    );
    expect(toQueryString({})).toBe("");
  });
});

describe("api client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("throws an ApiError with the server message", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Invalid email or password" }), { status: 401 }),
        ),
    );

    const error = await api.login("a@b.co", "wrong").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "Invalid email or password" });
  });

  it("sends filters as query parameters", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.listTickets({ status: "open", sort: "priority" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tickets?status=open&sort=priority",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
  });
});
