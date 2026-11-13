import { COLUMNS, type Member, type Ticket, type TicketEvent } from "./types";

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function formatRelative(iso: string, now: Date): string {
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return "à l'instant";
  if (diff < HOUR) return `il y a ${Math.floor(diff / MINUTE)} min`;

  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY);
  if (days === 0) return `il y a ${Math.floor(diff / HOUR)} h`;
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;

  const label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear()
    ? label
    : `${label} ${date.getFullYear()}`;
}

export function linkLabel(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const github =
    parsed.hostname === "github.com" &&
    parsed.pathname.match(/^\/[^/]+\/[^/]+\/(pull|issues)\/(\d+)/);
  if (github) {
    return `${github[1] === "pull" ? "PR" : "Issue"} #${github[2]}`;
  }
  return parsed.hostname.replace(/^www\./, "");
}

export function linkify(
  text: string,
): Array<{ type: "text" | "link"; value: string }> {
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  const pushText = (value: string) => {
    if (!value) return;
    const last = parts[parts.length - 1];
    if (last?.type === "text") last.value += value;
    else parts.push({ type: "text", value });
  };

  let cursor = 0;
  for (const match of text.matchAll(/https?:\/\/\S+/g)) {
    const raw = match[0];
    const url = raw.replace(/[.,;:!?)\]]+$/, "");
    pushText(text.slice(cursor, match.index));
    parts.push({ type: "link", value: url });
    cursor = (match.index ?? 0) + url.length;
  }
  pushText(text.slice(cursor));
  return parts;
}

export function actorLabel(actor: string, members: Member[]): string {
  if (actor === "claude") return "Claude";
  return members.find((m) => m.email === actor)?.name ?? actor;
}

export function eventLabel(event: TicketEvent, members: Member[]): string {
  switch (event.kind) {
    case "created":
      return "Créé";
    case "moved": {
      const column = COLUMNS.find((c) => c.id === event.detail);
      return column ? `Déplacé vers ${column.label}` : "Déplacé";
    }
    case "assigned":
      return event.detail
        ? `Confié à ${actorLabel(event.detail, members)}`
        : "Plus de responsable";
    case "edited":
      return "Modifié";
  }
}

export function ticketsForProject(
  tickets: Ticket[],
  slug: string | null,
): Ticket[] {
  return slug === null
    ? tickets
    : tickets.filter((t) => t.projectSlug === slug);
}
