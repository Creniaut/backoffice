import { makeEvent, members, tickets } from "../test/fixtures";
import {
  actorLabel,
  eventLabel,
  formatRelative,
  linkify,
  linkLabel,
  ticketsForProject,
} from "./format";

describe("formatRelative", () => {
  const now = new Date("2026-11-13T15:00:00");
  it.each([
    ["2026-11-13T14:59:40", "à l'instant"],
    ["2026-11-13T15:00:30", "à l'instant"],
    ["2026-11-13T14:55:00", "il y a 5 min"],
    ["2026-11-13T12:00:00", "il y a 3 h"],
    ["2026-11-13T00:30:00", "il y a 14 h"],
    ["2026-11-12T23:00:00", "hier"],
    ["2026-11-10T10:00:00", "il y a 3 j"],
    ["2026-11-04T10:00:00", "4 nov."],
    ["2026-08-01T10:00:00", "1 août"],
    ["2025-11-04T10:00:00", "4 nov. 2025"],
  ])("%s → %s", (iso, label) => expect(formatRelative(iso, now)).toBe(label));
});

describe("linkLabel", () => {
  it("labels a PR", () =>
    expect(linkLabel("https://github.com/Creniaut/notia/pull/148")).toBe(
      "PR #148",
    ));
  it("labels an issue", () =>
    expect(linkLabel("https://github.com/Creniaut/notia/issues/7")).toBe(
      "Issue #7",
    ));
  it("falls back to the host", () =>
    expect(linkLabel("https://www.notias.fr/mentions-legales")).toBe(
      "notias.fr",
    ));
  it("keeps an invalid URL as is", () =>
    expect(linkLabel("pas une url")).toBe("pas une url"));
});

describe("linkify", () => {
  it("splits URLs out of the text", () =>
    expect(linkify("voir https://notias.fr/a, puis")).toEqual([
      { type: "text", value: "voir " },
      { type: "link", value: "https://notias.fr/a" },
      { type: "text", value: ", puis" },
    ]));
  it("returns one text part without URL", () =>
    expect(linkify("rien")).toEqual([{ type: "text", value: "rien" }]));
});

it("actorLabel", () => {
  expect(actorLabel("claude", members)).toBe("Claude");
  expect(actorLabel("ec@example.com", members)).toBe("EmilienCR");
  expect(actorLabel("x@example.com", members)).toBe("x@example.com");
});

it("eventLabel", () => {
  expect(eventLabel(makeEvent("created", null), members)).toBe("Créé");
  expect(eventLabel(makeEvent("moved", "doing"), members)).toBe(
    "Déplacé vers En cours",
  );
  expect(eventLabel(makeEvent("assigned", "cb@example.com"), members)).toBe(
    "Confié à CreniautB",
  );
  expect(eventLabel(makeEvent("assigned", null), members)).toBe(
    "Plus de responsable",
  );
  expect(eventLabel(makeEvent("edited", null), members)).toBe("Modifié");
});

describe("ticketsForProject", () => {
  it("keeps all tickets for null", () =>
    expect(ticketsForProject(tickets, null)).toHaveLength(tickets.length));
  it("keeps only the project's tickets", () =>
    expect(ticketsForProject(tickets, "back-office").map((t) => t.id)).toEqual([
      8, 9, 10,
    ]));
});
