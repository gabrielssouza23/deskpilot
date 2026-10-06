import { describe, expect, it } from "vitest";

import { initials, languageName, timeAgo } from "../format";

describe("timeAgo", () => {
  const now = new Date("2026-01-10T12:00:00Z");

  it.each([
    ["2026-01-10T11:59:30Z", "just now"],
    ["2026-01-10T11:55:00Z", "5 minutes ago"],
    ["2026-01-10T09:00:00Z", "3 hours ago"],
    ["2026-01-09T12:00:00Z", "yesterday"],
    ["2025-12-27T12:00:00Z", "2 weeks ago"],
  ])("formats %s as %s", (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});

describe("initials", () => {
  it("uses first and last name", () => {
    expect(initials("Gabriel de Souza Silva")).toBe("GS");
    expect(initials("ada")).toBe("A");
    expect(initials("   ")).toBe("?");
  });
});

describe("languageName", () => {
  it("names known languages and falls back to the code", () => {
    expect(languageName("pt")).toBe("Portuguese");
    expect(languageName("ja")).toBe("JA");
  });
});
