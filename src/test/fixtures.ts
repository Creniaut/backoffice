import type { Member, Project, Ticket, TicketEvent } from "../board/types";

export const members: Member[] = [
  { email: "cb@example.com", name: "CreniautB", initials: "CB" },
  { email: "ec@example.com", name: "EmilienCR", initials: "EC" },
];

export const projects: Project[] = [
  { slug: "notia", name: "Notia", color: "oklch(0.55 0.12 202)" },
  { slug: "back-office", name: "Back-office", color: "oklch(0.62 0.13 75)" },
];

export function makeTicket(
  id: number,
  projectSlug: string,
  status: Ticket["status"],
  position: number,
  title: string,
  extra: Partial<Ticket> = {},
): Ticket {
  return {
    id,
    projectSlug,
    title,
    description: "",
    status,
    assigneeEmail: null,
    link: null,
    position,
    createdAt: "2026-11-01T10:00:00",
    updatedAt: "2026-11-10T10:00:00",
    lastActor: "cb@example.com",
    imageCount: 0,
    ...extra,
  };
}

export const CLAUDE_TICKET_ID = 5;

export const tickets: Ticket[] = [
  makeTicket(1, "notia", "idea", 0, "Application Android sur le Play Store"),
  makeTicket(2, "notia", "idea", 1, "Barre d'onglets en bas sur mobile"),
  makeTicket(3, "notia", "todo", 0, "Compléter les mentions légales", {
    assigneeEmail: "cb@example.com",
    imageCount: 2,
    description: "Voir https://notias.fr/mentions-legales avant tout.",
  }),
  makeTicket(4, "notia", "todo", 1, "Mettre en place les e-mails @notias.fr", {
    assigneeEmail: "ec@example.com",
  }),
  makeTicket(
    CLAUDE_TICKET_ID,
    "notia",
    "doing",
    2,
    "Repères : caler les scores sur une semaine de vrais joueurs",
    {
      assigneeEmail: "cb@example.com",
      lastActor: "claude",
      updatedAt: "2026-11-12T18:00:00",
    },
  ),
  makeTicket(6, "notia", "doing", 5, "Accueil : vérifier la direction E", {
    assigneeEmail: "ec@example.com",
  }),
  makeTicket(7, "notia", "done", 0, "Accueil direction E en ligne", {
    assigneeEmail: "cb@example.com",
    link: "https://github.com/Creniaut/notia/pull/148",
    lastActor: "claude",
  }),
  makeTicket(8, "back-office", "todo", 2, "Créer le projet Supabase", {
    assigneeEmail: "cb@example.com",
  }),
  makeTicket(9, "back-office", "doing", 7, "Valider la maquette du tableau", {
    assigneeEmail: "cb@example.com",
  }),
  makeTicket(10, "back-office", "done", 1, "Initialiser le repo"),
];

export function makeEvent(
  kind: TicketEvent["kind"],
  detail: string | null,
  extra: Partial<TicketEvent> = {},
): TicketEvent {
  return {
    id: 1,
    ticketId: CLAUDE_TICKET_ID,
    actor: "cb@example.com",
    kind,
    detail,
    at: "2026-11-06T10:00:00",
    ...extra,
  };
}

export function makeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}
