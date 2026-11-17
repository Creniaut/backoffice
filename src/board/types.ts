export type Status = "idea" | "todo" | "doing" | "done";

export const COLUMNS: ReadonlyArray<{ id: Status; label: string }> = [
  { id: "idea", label: "Idées" },
  { id: "todo", label: "À faire" },
  { id: "doing", label: "En cours" },
  { id: "done", label: "Fait" },
];

export type Priority = "high" | "medium" | "low";

export const PRIORITIES: ReadonlyArray<{ id: Priority; label: string }> = [
  { id: "high", label: "Haute" },
  { id: "medium", label: "Moyenne" },
  { id: "low", label: "Basse" },
];

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: ReadonlyArray<{ id: Difficulty; label: string }> = [
  { id: "easy", label: "Facile" },
  { id: "medium", label: "Moyenne" },
  { id: "hard", label: "Difficile" },
];

export interface Member {
  email: string;
  name: string;
  initials: string;
}

export interface Project {
  slug: string;
  name: string;
  color: string;
}

export interface Ticket {
  id: number;
  projectSlug: string;
  title: string;
  description: string;
  status: Status;
  assigneeEmail: string | null;
  link: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  lastActor: string;
  imageCount: number;
  priority: Priority | null;
  difficulty: Difficulty | null;
}

export type EventKind = "created" | "moved" | "assigned" | "edited";

export interface TicketEvent {
  id: number;
  ticketId: number;
  actor: string;
  kind: EventKind;
  detail: string | null;
  at: string;
}

export interface TicketImage {
  id: number;
  ticketId: number;
  path: string;
  url: string;
  createdAt: string;
}

export interface Board {
  projects: Project[];
  members: Member[];
  tickets: Ticket[];
}

export type TicketPatch = Partial<
  Pick<
    Ticket,
    | "title"
    | "description"
    | "status"
    | "assigneeEmail"
    | "link"
    | "position"
    | "priority"
    | "difficulty"
  >
>;
