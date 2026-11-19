import { makeTicket, projects } from "../test/fixtures";
import {
  activeProjects,
  activeTickets,
  archivedProjects,
  defaultColor,
  PROJECT_COLORS,
  slugify,
} from "./projects";
import type { Project } from "./types";

const ARCHIVED_AT = "2026-11-19T10:00:00Z";

function archive(slug: string): Project[] {
  return projects.map((p) =>
    p.slug === slug ? { ...p, archivedAt: ARCHIVED_AT } : p,
  );
}

it.each([
  ["Outil travaux", "outil-travaux"],
  ["  Écran d'accueil  ", "ecran-d-accueil"],
  ["Back--Office!!", "back-office"],
  ["Notia 2", "notia-2"],
  ["!!!", ""],
  ["🎯", ""],
])("slugify(%j) = %j", (name, slug) => {
  expect(slugify(name)).toBe(slug);
});

it("defaultColor skips colors of active projects", () => {
  expect(defaultColor(projects)).toBe(PROJECT_COLORS[2]);
});

it("defaultColor ignores archived projects", () => {
  expect(defaultColor(archive("notia"))).toBe(PROJECT_COLORS[0]);
});

it("defaultColor falls back to the first color when all are taken", () => {
  const all: Project[] = PROJECT_COLORS.map((color, i) => ({
    slug: `p${i}`,
    name: `P${i}`,
    color,
    archivedAt: null,
  }));
  expect(defaultColor(all)).toBe(PROJECT_COLORS[0]);
});

it("activeProjects and archivedProjects split on archivedAt", () => {
  const list = archive("notia");
  expect(activeProjects(list).map((p) => p.slug)).toEqual(["back-office"]);
  expect(archivedProjects(list).map((p) => p.slug)).toEqual(["notia"]);
});

it("activeTickets drops tickets of archived projects", () => {
  const tickets = [
    makeTicket(1, "notia", "todo", 1, "A"),
    makeTicket(2, "back-office", "todo", 2, "B"),
  ];
  expect(activeTickets(tickets, archive("notia")).map((t) => t.id)).toEqual([
    2,
  ]);
});
