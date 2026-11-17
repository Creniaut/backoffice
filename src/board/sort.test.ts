import { makeTicket } from "../test/fixtures";
import { readSortMode, sortLane, writeSortMode } from "./sort";
import type { Difficulty, Priority } from "./types";

const card = (
  id: number,
  position: number,
  priority: Priority | null,
  difficulty: Difficulty | null,
) =>
  makeTicket(id, "notia", "todo", position, `T${id}`, {
    priority,
    difficulty,
  });

describe("sortLane", () => {
  it("priority mode ranks high, medium, low, then none; easy first; then position", () => {
    const lane = [
      card(1, 0, "low", null),
      card(2, 1, null, null),
      card(3, 2, "high", "hard"),
      card(4, 3, "high", "easy"),
      card(5, 4, "medium", null),
      card(6, 5, "high", "easy"),
      card(7, 6, "high", null),
    ];
    expect(sortLane(lane, "priority").map((t) => t.id)).toEqual([
      4, 6, 3, 7, 5, 1, 2,
    ]);
  });

  it("manual mode keeps the position order", () => {
    const lane = [card(1, 2, "high", null), card(2, 0, null, null)];
    expect(sortLane(lane, "manual").map((t) => t.id)).toEqual([2, 1]);
  });

  it("returns a new array", () => {
    const lane = [card(1, 1, null, null), card(2, 0, null, null)];
    sortLane(lane, "manual");
    expect(lane.map((t) => t.id)).toEqual([1, 2]);
  });
});

describe("readSortMode", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns the stored mode", () => {
    writeSortMode("priority");
    expect(readSortMode()).toBe("priority");
  });

  it("falls back to manual without a stored value", () => {
    expect(readSortMode()).toBe("manual");
  });

  it("falls back to manual for an unknown value", () => {
    localStorage.setItem("board-sort", "n'importe quoi");
    expect(readSortMode()).toBe("manual");
  });

  it("falls back to manual when the storage is refused", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("refusé");
    });
    expect(readSortMode()).toBe("manual");
  });

  it("writing does not throw when the storage is refused", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("refusé");
    });
    expect(() => writeSortMode("priority")).not.toThrow();
  });
});
