import { tickets } from "../test/fixtures";
import { positionBetween, resolveDrop, topPosition } from "./position";

describe("positionBetween", () => {
  it("returns 0 for an empty column", () =>
    expect(positionBetween(null, null)).toBe(0));
  it("goes above the first", () => expect(positionBetween(null, 4)).toBe(3));
  it("goes below the last", () => expect(positionBetween(4, null)).toBe(5));
  it("splits the gap", () => expect(positionBetween(1, 2)).toBe(1.5));
});

describe("topPosition", () => {
  it("is min - 1 of the column", () =>
    expect(topPosition(tickets, "doing")).toBe(1));
  it("is 0 when the column is empty", () =>
    expect(topPosition([], "done")).toBe(0));
});

describe("resolveDrop", () => {
  it("drops on an empty column at 0", () => {
    const open = tickets.filter((t) => t.status !== "done");
    expect(
      resolveDrop(open, 3, { status: "done", overTicketId: null }),
    ).toEqual({ status: "done", position: 0 });
  });

  it("drops before the hovered card from another column", () => {
    expect(
      resolveDrop(tickets, 3, { status: "doing", overTicketId: 6 }),
    ).toEqual({ status: "doing", position: 3.5 });
  });

  it("moving down in the same column lands after the hovered card", () => {
    expect(
      resolveDrop(tickets, 5, { status: "doing", overTicketId: 6 }),
    ).toEqual({ status: "doing", position: 6 });
  });

  it("moving up in the same column lands before the hovered card", () => {
    expect(
      resolveDrop(tickets, 9, { status: "doing", overTicketId: 5 }),
    ).toEqual({ status: "doing", position: 1 });
  });

  it("appends at the end of another column", () => {
    expect(
      resolveDrop(tickets, 1, { status: "doing", overTicketId: null }),
    ).toEqual({ status: "doing", position: 8 });
  });

  it("returns null when nothing changes", () => {
    expect(
      resolveDrop(tickets, 9, { status: "doing", overTicketId: null }),
    ).toBeNull();
    expect(
      resolveDrop(tickets, 5, { status: "doing", overTicketId: 5 }),
    ).toBeNull();
  });
});
