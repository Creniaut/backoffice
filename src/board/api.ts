import { supabase } from "../lib/supabase";
import { imageExtension, validateImage } from "./images";
import type {
  Board,
  Member,
  Project,
  Status,
  Ticket,
  TicketEvent,
  TicketImage,
  TicketPatch,
} from "./types";

const BUCKET = "ticket-images";
const SIGNED_URL_SECONDS = 3600;
const TICKET_COLUMNS = "*, ticket_images(count)";

interface Response<T> {
  data: T | null;
  error: { message: string } | null;
}

interface TicketRow {
  id: number;
  project_slug: string;
  title: string;
  description: string;
  status: Status;
  assignee_email: string | null;
  link: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  last_actor: string;
  ticket_images?: Array<{ count: number }>;
}

interface EventRow {
  id: number;
  ticket_id: number;
  actor: string;
  kind: TicketEvent["kind"];
  detail: string | null;
  at: string;
}

interface ImageRow {
  id: number;
  ticket_id: number;
  path: string;
  created_at: string;
}

function unwrap<T>({ data, error }: Response<T>): T {
  if (error) throw new Error(error.message);
  return data as T;
}

function ensureRows(rows: unknown[] | null): void {
  if (!rows || rows.length === 0) {
    throw new Error("Aucune ligne modifiée : session expirée ou accès refusé.");
  }
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    title: row.title,
    description: row.description,
    status: row.status,
    assigneeEmail: row.assignee_email,
    link: row.link,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActor: row.last_actor,
    imageCount: row.ticket_images?.[0]?.count ?? 0,
  };
}

function toRow(patch: TicketPatch): Record<string, unknown> {
  const columns: Record<keyof TicketPatch, string> = {
    title: "title",
    description: "description",
    status: "status",
    assigneeEmail: "assignee_email",
    link: "link",
    position: "position",
  };
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      columns[key as keyof TicketPatch],
      value,
    ]),
  );
}

export async function fetchBoard(): Promise<Board> {
  const [projects, members, tickets] = await Promise.all([
    supabase.from("projects").select("slug, name, color").order("name"),
    supabase.from("members").select("email, name, initials").order("name"),
    supabase.from("tickets").select(TICKET_COLUMNS).order("position"),
  ]);
  return {
    projects: unwrap<Project[]>(projects) ?? [],
    members: unwrap<Member[]>(members) ?? [],
    tickets: (unwrap<TicketRow[]>(tickets) ?? []).map(toTicket),
  };
}

export async function fetchIsMember(email: string): Promise<boolean> {
  const row = unwrap(
    await supabase
      .from("members")
      .select("email")
      .eq("email", email)
      .maybeSingle(),
  );
  return row !== null;
}

export async function createTicket(input: {
  projectSlug: string;
  title: string;
  description: string;
  status: Status;
  assigneeEmail: string | null;
  position: number;
}): Promise<Ticket> {
  const row = unwrap<TicketRow>(
    await supabase
      .from("tickets")
      .insert({
        project_slug: input.projectSlug,
        title: input.title,
        description: input.description,
        status: input.status,
        assignee_email: input.assigneeEmail,
        position: input.position,
      })
      .select(TICKET_COLUMNS)
      .single(),
  );
  return toTicket(row);
}

export async function updateTicket(
  id: number,
  patch: TicketPatch,
): Promise<void> {
  ensureRows(
    unwrap(
      await supabase
        .from("tickets")
        .update(toRow(patch))
        .eq("id", id)
        .select("id"),
    ),
  );
}

export async function deleteTicket(id: number): Promise<void> {
  const images =
    unwrap<Array<{ path: string }>>(
      await supabase.from("ticket_images").select("path").eq("ticket_id", id),
    ) ?? [];
  if (images.length > 0) {
    unwrap(
      await supabase.storage
        .from(BUCKET)
        .remove(images.map((image) => image.path)),
    );
  }
  ensureRows(
    unwrap(await supabase.from("tickets").delete().eq("id", id).select("id")),
  );
}

export async function fetchEvents(ticketId: number): Promise<TicketEvent[]> {
  const rows =
    unwrap<EventRow[]>(
      await supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("at", { ascending: false }),
    ) ?? [];
  return rows.map((row) => ({
    id: row.id,
    ticketId: row.ticket_id,
    actor: row.actor,
    kind: row.kind,
    detail: row.detail,
    at: row.at,
  }));
}

export async function fetchImages(ticketId: number): Promise<TicketImage[]> {
  const rows =
    unwrap<ImageRow[]>(
      await supabase
        .from("ticket_images")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at"),
    ) ?? [];
  if (rows.length === 0) return [];
  const signed =
    unwrap<Array<{ path: string | null; signedUrl: string | null }>>(
      await supabase.storage.from(BUCKET).createSignedUrls(
        rows.map((row) => row.path),
        SIGNED_URL_SECONDS,
      ),
    ) ?? [];
  const urls = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return rows.map((row) => ({
    id: row.id,
    ticketId: row.ticket_id,
    path: row.path,
    url: urls.get(row.path) ?? "",
    createdAt: row.created_at,
  }));
}

export async function uploadImage(ticketId: number, file: File): Promise<void> {
  const invalid = validateImage(file);
  if (invalid) throw new Error(invalid);
  const path = `${ticketId}/${crypto.randomUUID()}.${imageExtension(file)}`;
  unwrap(
    await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type }),
  );
  try {
    unwrap(
      await supabase
        .from("ticket_images")
        .insert({ ticket_id: ticketId, path }),
    );
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

export async function deleteImage(image: TicketImage): Promise<void> {
  unwrap(await supabase.storage.from(BUCKET).remove([image.path]));
  unwrap(await supabase.from("ticket_images").delete().eq("id", image.id));
}
