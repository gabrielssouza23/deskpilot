import { describe, expect, it } from "vitest";

import { parseFilters } from "../dashboard/ticket-queue";

describe("parseFilters", () => {
  it("reads valid filters from the URL", () => {
    const params = new URLSearchParams("status=open&priority=urgent&q=refund&page=3&sort=priority");
    expect(parseFilters(params)).toEqual({
      status: "open",
      priority: "urgent",
      category: undefined,
      q: "refund",
      sort: "priority",
      page: 3,
    });
  });

  it("ignores unknown values instead of sending them to the API", () => {
    const params = new URLSearchParams("status=deleted&priority=asap&page=-1&sort=random");
    expect(parseFilters(params)).toEqual({
      status: undefined,
      priority: undefined,
      category: undefined,
      q: undefined,
      sort: undefined,
      page: undefined,
    });
  });
});
