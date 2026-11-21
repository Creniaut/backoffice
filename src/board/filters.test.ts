import { makeTicket } from "../test/fixtures";
import {
  hasFilters,
  matchesFilters,
  NO_FILTERS,
  readFilters,
  writeFilters,
  type BoardFilters,
} from "./filters";

const ticket = makeTicket(1, "notia", "todo", 0, "T", {
  priority: "high",
  difficulty: null,
  assigneeEmail: "ana@example.com",
});

const only = (filters: Partial<BoardFilters>): BoardFilters => ({
  ...NO_FILTERS,
  ...filters,
});

describe("matchesFilters", () => {
  it("keeps every ticket without filters", () => {
    expect(matchesFilters(ticket, NO_FILTERS)).toBe(true);
  });

  it("keeps a ticket whose priority is checked", () => {
    expect(matchesFilters(ticket, only({ priorities: ["high", "low"] }))).toBe(
      true,
    );
    expect(matchesFilters(ticket, only({ priorities: ["medium"] }))).toBe(
      false,
    );
  });

  it("« none » stands for a ticket without difficulty", () => {
    expect(matchesFilters(ticket, only({ difficulties: ["none"] }))).toBe(true);
    expect(matchesFilters(ticket, only({ difficulties: ["easy"] }))).toBe(
      false,
    );
  });

  it("keeps a ticket whose assignee is checked, « none » for unassigned", () => {
    expect(
      matchesFilters(ticket, only({ assignees: ["ana@example.com"] })),
    ).toBe(true);
    expect(
      matchesFilters(ticket, only({ assignees: ["bob@example.com", "none"] })),
    ).toBe(false);
    expect(
      matchesFilters(
        { ...ticket, assigneeEmail: null },
        only({ assignees: ["none"] }),
      ),
    ).toBe(true);
  });

  it("a ticket must match every filter", () => {
    expect(
      matchesFilters(
        ticket,
        only({ priorities: ["high"], difficulties: ["hard"] }),
      ),
    ).toBe(false);
    expect(
      matchesFilters(
        ticket,
        only({ priorities: ["high"], assignees: ["bob@example.com"] }),
      ),
    ).toBe(false);
  });
});

describe("hasFilters", () => {
  it("is false without any checked choice", () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(hasFilters(only({ difficulties: ["none"] }))).toBe(true);
    expect(hasFilters(only({ assignees: ["none"] }))).toBe(true);
  });
});

describe("readFilters", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns the stored filters", () => {
    writeFilters({
      priorities: ["high", "none"],
      difficulties: ["easy"],
      assignees: ["ana@example.com", "none"],
    });
    expect(readFilters()).toEqual({
      priorities: ["high", "none"],
      difficulties: ["easy"],
      assignees: ["ana@example.com", "none"],
    });
  });

  it("drops unknown levels and non-text assignees", () => {
    localStorage.setItem(
      "board-filters",
      JSON.stringify({
        priorities: ["high", "urgent", 3],
        difficulties: "x",
        assignees: ["ana@example.com", 4, "ana@example.com"],
      }),
    );
    expect(readFilters()).toEqual({
      priorities: ["high"],
      difficulties: [],
      assignees: ["ana@example.com"],
    });
  });

  it("filters stored before the assignee menu read as no assignee filter", () => {
    localStorage.setItem(
      "board-filters",
      JSON.stringify({ priorities: ["low"], difficulties: [] }),
    );
    expect(readFilters()).toEqual(only({ priorities: ["low"] }));
  });

  it("falls back to no filters for unreadable JSON", () => {
    localStorage.setItem("board-filters", "{");
    expect(readFilters()).toEqual(NO_FILTERS);
  });

  it("falls back to no filters when the storage is refused", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("refusé");
    });
    expect(readFilters()).toEqual(NO_FILTERS);
  });

  it("writing does not throw when the storage is refused", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("refusé");
    });
    expect(() => writeFilters(NO_FILTERS)).not.toThrow();
  });
});
