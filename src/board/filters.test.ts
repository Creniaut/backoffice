import { makeTicket } from "../test/fixtures";
import {
  hasFilters,
  matchesFilters,
  NO_FILTERS,
  readFilters,
  writeFilters,
} from "./filters";

const ticket = makeTicket(1, "notia", "todo", 0, "T", {
  priority: "high",
  difficulty: null,
});

describe("matchesFilters", () => {
  it("keeps every ticket without filters", () => {
    expect(matchesFilters(ticket, NO_FILTERS)).toBe(true);
  });

  it("keeps a ticket whose priority is checked", () => {
    expect(
      matchesFilters(ticket, { priorities: ["high", "low"], difficulties: [] }),
    ).toBe(true);
    expect(
      matchesFilters(ticket, { priorities: ["medium"], difficulties: [] }),
    ).toBe(false);
  });

  it("« none » stands for a ticket without difficulty", () => {
    expect(
      matchesFilters(ticket, { priorities: [], difficulties: ["none"] }),
    ).toBe(true);
    expect(
      matchesFilters(ticket, { priorities: [], difficulties: ["easy"] }),
    ).toBe(false);
  });

  it("a ticket must match both filters", () => {
    expect(
      matchesFilters(ticket, { priorities: ["high"], difficulties: ["hard"] }),
    ).toBe(false);
  });
});

describe("hasFilters", () => {
  it("is false without any checked level", () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(hasFilters({ priorities: [], difficulties: ["none"] })).toBe(true);
  });
});

describe("readFilters", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns the stored filters", () => {
    writeFilters({ priorities: ["high", "none"], difficulties: ["easy"] });
    expect(readFilters()).toEqual({
      priorities: ["high", "none"],
      difficulties: ["easy"],
    });
  });

  it("drops unknown levels", () => {
    localStorage.setItem(
      "board-filters",
      JSON.stringify({ priorities: ["high", "urgent", 3], difficulties: "x" }),
    );
    expect(readFilters()).toEqual({ priorities: ["high"], difficulties: [] });
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
