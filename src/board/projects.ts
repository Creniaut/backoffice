import type { Project, Ticket } from "./types";

export const PROJECT_COLORS = [
  "oklch(0.55 0.12 202)",
  "oklch(0.62 0.13 75)",
  "oklch(0.55 0.14 145)",
  "oklch(0.55 0.15 300)",
  "oklch(0.58 0.16 25)",
  "oklch(0.55 0.13 250)",
  "oklch(0.6 0.14 340)",
  "oklch(0.5 0.03 255)",
] as const;

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function activeProjects(projects: Project[]): Project[] {
  return projects.filter((p) => p.archivedAt === null);
}

export function archivedProjects(projects: Project[]): Project[] {
  return projects.filter((p) => p.archivedAt !== null);
}

export function defaultColor(projects: Project[]): string {
  const used = new Set(activeProjects(projects).map((p) => p.color));
  return PROJECT_COLORS.find((color) => !used.has(color)) ?? PROJECT_COLORS[0];
}

export function activeTickets(
  tickets: Ticket[],
  projects: Project[],
): Ticket[] {
  const active = new Set(activeProjects(projects).map((p) => p.slug));
  return tickets.filter((t) => active.has(t.projectSlug));
}
