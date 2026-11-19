import { supabase } from "../lib/supabase";
import { makeFile } from "../test/fixtures";
import type { FakeSupabase } from "../test/fakeSupabase";
import {
  createProject,
  createTicket,
  deleteTicket,
  fetchBoard,
  fetchImages,
  fetchIsMember,
  updateProject,
  updateTicket,
  uploadImage,
} from "./api";
import { PROJECT_EXISTS } from "./projects";

vi.mock("../lib/supabase", async () => {
  const { createFakeSupabase } = await import("../test/fakeSupabase");
  return { supabase: createFakeSupabase() };
});

const fake = supabase as unknown as FakeSupabase;
const ok = (data: unknown) => ({ data, error: null });

beforeEach(() => fake.reset());

it("deleteTicket removes images from storage before the row", async () => {
  fake.results.set(
    "select ticket_images",
    ok([{ path: "10/a.png" }, { path: "10/b.png" }]),
  );
  fake.results.set("delete tickets", ok([{ id: 10 }]));
  await deleteTicket(10);
  expect(fake.calls).toEqual([
    "select ticket_images 10",
    "storage.remove 10/a.png,10/b.png",
    "delete tickets 10",
  ]);
});

it("deleteTicket skips storage when the ticket has no image", async () => {
  fake.results.set("select ticket_images", ok([]));
  fake.results.set("delete tickets", ok([{ id: 10 }]));
  await deleteTicket(10);
  expect(fake.calls).toEqual(["select ticket_images 10", "delete tickets 10"]);
});

it("uploadImage refuses an invalid file without calling Supabase", async () => {
  await expect(
    uploadImage(10, makeFile("a.heic", "image/heic", 10)),
  ).rejects.toThrow("Format non pris en charge");
  expect(fake.calls).toEqual([]);
});

it("uploadImage stores the file under the ticket then records it", async () => {
  await uploadImage(10, makeFile("a.png", "image/png", 10));
  expect(fake.calls[0]).toMatch(/^storage\.upload 10\/[0-9a-f-]{36}\.png$/);
  expect(fake.calls[1]).toBe("insert ticket_images");
  expect(fake.payloads.get("insert ticket_images")).toMatchObject({
    ticket_id: 10,
  });
});

it("fetchBoard maps rows to camelCase with imageCount", async () => {
  fake.results.set(
    "select projects",
    ok([{ slug: "notia", name: "Notia", color: "c" }]),
  );
  fake.results.set(
    "select members",
    ok([{ email: "cb@example.com", name: "CreniautB", initials: "CB" }]),
  );
  fake.results.set(
    "select tickets",
    ok([
      {
        id: 3,
        project_slug: "notia",
        title: "T",
        description: "",
        status: "todo",
        assignee_email: null,
        link: null,
        position: 0,
        created_at: "a",
        updated_at: "b",
        last_actor: "claude",
        priority: "high",
        difficulty: null,
        ticket_images: [{ count: 2 }],
      },
    ]),
  );
  const board = await fetchBoard();
  expect(board.projects).toHaveLength(1);
  expect(board.members[0].initials).toBe("CB");
  expect(board.tickets[0]).toMatchObject({
    projectSlug: "notia",
    assigneeEmail: null,
    imageCount: 2,
    lastActor: "claude",
    createdAt: "a",
    updatedAt: "b",
    priority: "high",
    difficulty: null,
  });
});

it("fetchBoard maps a row without the new columns to null", async () => {
  fake.results.set("select projects", ok([]));
  fake.results.set("select members", ok([]));
  fake.results.set(
    "select tickets",
    ok([
      {
        id: 4,
        project_slug: "notia",
        title: "Ancien",
        description: "",
        status: "idea",
        assignee_email: null,
        link: null,
        position: 0,
        created_at: "a",
        updated_at: "b",
        last_actor: "claude",
      },
    ]),
  );
  const board = await fetchBoard();
  expect(board.tickets[0]).toMatchObject({ priority: null, difficulty: null });
});

it("createTicket sends priority and difficulty", async () => {
  fake.results.set(
    "insert tickets",
    ok({
      id: 9,
      project_slug: "notia",
      title: "Nouveau",
      description: "",
      status: "todo",
      assignee_email: null,
      link: null,
      position: -1,
      created_at: "a",
      updated_at: "b",
      last_actor: "cb@example.com",
      priority: "medium",
      difficulty: "easy",
    }),
  );
  const ticket = await createTicket({
    projectSlug: "notia",
    title: "Nouveau",
    description: "",
    status: "todo",
    assigneeEmail: null,
    position: -1,
    priority: "medium",
    difficulty: "easy",
  });
  expect(fake.payloads.get("insert tickets")).toMatchObject({
    priority: "medium",
    difficulty: "easy",
  });
  expect(ticket).toMatchObject({ priority: "medium", difficulty: "easy" });
});

it("updateTicket sends snake_case columns", async () => {
  fake.results.set("update tickets", ok([{ id: 3 }]));
  await updateTicket(3, {
    status: "done",
    position: 0,
    assigneeEmail: null,
    priority: "low",
    difficulty: "hard",
  });
  expect(fake.payloads.get("update tickets")).toEqual({
    status: "done",
    position: 0,
    assignee_email: null,
    priority: "low",
    difficulty: "hard",
  });
  expect(fake.calls).toEqual(["update tickets 3"]);
});

it("updateTicket fails when no row was updated (session expired, RLS)", async () => {
  fake.results.set("update tickets", ok([]));
  await expect(updateTicket(3, { status: "done" })).rejects.toThrow();
});

it("fetchIsMember is false when the member row is not visible", async () => {
  fake.results.set("select members", ok(null));
  expect(await fetchIsMember("intrus@example.com")).toBe(false);
  fake.results.set("select members", ok({ email: "cb@example.com" }));
  expect(await fetchIsMember("cb@example.com")).toBe(true);
});

it("fetchImages signs the paths for one hour", async () => {
  fake.results.set(
    "select ticket_images",
    ok([{ id: 1, ticket_id: 3, path: "3/a.png", created_at: "x" }]),
  );
  fake.results.set(
    "storage.sign",
    ok([{ path: "3/a.png", signedUrl: "https://signed/a" }]),
  );
  expect(await fetchImages(3)).toEqual([
    {
      id: 1,
      ticketId: 3,
      path: "3/a.png",
      url: "https://signed/a",
      createdAt: "x",
    },
  ]);
  expect(fake.calls).toContain("storage.sign 3/a.png 3600");
});

it("a Supabase error is thrown with its message", async () => {
  fake.results.set("select projects", {
    data: null,
    error: { message: "JWT expired" },
  });
  await expect(fetchBoard()).rejects.toThrow("JWT expired");
});

it("fetchBoard maps archived_at to archivedAt", async () => {
  fake.results.set(
    "select projects",
    ok([
      { slug: "notia", name: "Notia", color: "c", archived_at: null },
      {
        slug: "old",
        name: "Old",
        color: "d",
        archived_at: "2026-11-19T10:00:00Z",
      },
    ]),
  );
  fake.results.set("select members", ok([]));
  fake.results.set("select tickets", ok([]));
  const board = await fetchBoard();
  expect(board.projects).toEqual([
    { slug: "notia", name: "Notia", color: "c", archivedAt: null },
    {
      slug: "old",
      name: "Old",
      color: "d",
      archivedAt: "2026-11-19T10:00:00Z",
    },
  ]);
});

it("createProject inserts slug, name and color", async () => {
  await createProject({ slug: "outil", name: "Outil", color: "c" });
  expect(fake.calls).toEqual(["insert projects"]);
  expect(fake.payloads.get("insert projects")).toEqual({
    slug: "outil",
    name: "Outil",
    color: "c",
  });
});

it("createProject turns a duplicate slug into PROJECT_EXISTS", async () => {
  fake.results.set("insert projects", {
    data: null,
    error: { message: "duplicate key", code: "23505" },
  });
  await expect(
    createProject({ slug: "notia", name: "Notia", color: "c" }),
  ).rejects.toThrow(PROJECT_EXISTS);
});

it("createProject keeps other errors as they are", async () => {
  fake.results.set("insert projects", {
    data: null,
    error: { message: "permission denied", code: "42501" },
  });
  await expect(
    createProject({ slug: "x", name: "X", color: "c" }),
  ).rejects.toThrow("permission denied");
});

it("updateProject maps archivedAt to archived_at", async () => {
  fake.results.set("update projects", ok([{ slug: "notia" }]));
  await updateProject("notia", { archivedAt: null });
  expect(fake.calls).toEqual(["update projects notia"]);
  expect(fake.payloads.get("update projects")).toEqual({ archived_at: null });
});

it("updateProject sends name and color", async () => {
  fake.results.set("update projects", ok([{ slug: "notia" }]));
  await updateProject("notia", { name: "Notia 2", color: "d" });
  expect(fake.payloads.get("update projects")).toEqual({
    name: "Notia 2",
    color: "d",
  });
});

it("updateProject fails when no row changed", async () => {
  fake.results.set("update projects", ok([]));
  await expect(updateProject("notia", { name: "N" })).rejects.toThrow(
    "Aucune ligne modifiée",
  );
});
