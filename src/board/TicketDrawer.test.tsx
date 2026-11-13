import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { AppRoutes } from "../AppRoutes";
import { toaster } from "../components/toaster";
import {
  CLAUDE_TICKET_ID,
  makeEvent,
  members,
  projects,
  tickets,
} from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import {
  deleteTicket,
  fetchBoard,
  fetchEvents,
  fetchImages,
  updateTicket,
} from "./api";

vi.mock("./api", () => ({
  fetchBoard: vi.fn(),
  fetchEvents: vi.fn(),
  fetchImages: vi.fn(),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));
vi.mock("../components/toaster", () => ({ toaster: { create: vi.fn() } }));

function LocationDisplay() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname + location.search}
    </output>
  );
}

function renderAt(route: string) {
  return renderWithProviders(
    <>
      <AppRoutes />
      <LocationDisplay />
    </>,
    { route },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T15:00:00"));
  vi.mocked(fetchBoard).mockResolvedValue({ projects, members, tickets });
  vi.mocked(fetchEvents).mockResolvedValue([]);
  vi.mocked(fetchImages).mockResolvedValue([]);
  vi.mocked(updateTicket).mockResolvedValue();
  vi.mocked(deleteTicket).mockResolvedValue();
});
afterEach(() => vi.useRealTimers());

it("?ticket=<id> opens the drawer with title, project, column and assignee", async () => {
  renderAt(`/todo?ticket=${CLAUDE_TICKET_ID}`);
  const drawer = await screen.findByRole("dialog", {
    name: "Repères : caler les scores sur une semaine de vrais joueurs",
  });
  expect(within(drawer).getByLabelText("Modifier le titre")).toHaveTextContent(
    "Repères : caler les scores sur une semaine de vrais joueurs",
  );
  expect(within(drawer).getByText("Notia")).toBeInTheDocument();
  expect(within(drawer).getByLabelText("Colonne")).toHaveValue("doing");
  expect(within(drawer).getByLabelText("Qui s'en occupe")).toHaveValue(
    "cb@example.com",
  );
});

it("?ticket=999 keeps it closed, removes the param and toasts « Ticket introuvable »", async () => {
  renderAt("/todo/notia?ticket=999");
  await screen.findByRole("heading", { name: "Tableau" });
  await vi.waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/todo\/notia$/),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(toaster.create).toHaveBeenCalledWith(
    expect.objectContaining({ type: "error", title: "Ticket introuvable" }),
  );
});

it("changing « Colonne » to « Fait » sends status done at the top of the column", async () => {
  renderAt(`/todo?ticket=${CLAUDE_TICKET_ID}`);
  const drawer = await screen.findByRole("dialog");
  await userEvent.selectOptions(
    within(drawer).getByLabelText("Colonne"),
    "done",
  );
  await vi.waitFor(() =>
    expect(updateTicket).toHaveBeenCalledWith(CLAUDE_TICKET_ID, {
      status: "done",
      position: -1,
    }),
  );
});

it("changing « Qui s'en occupe » to « Personne » clears the assignee", async () => {
  renderAt(`/todo?ticket=${CLAUDE_TICKET_ID}`);
  const drawer = await screen.findByRole("dialog");
  await userEvent.selectOptions(
    within(drawer).getByLabelText("Qui s'en occupe"),
    "",
  );
  await vi.waitFor(() =>
    expect(updateTicket).toHaveBeenCalledWith(CLAUDE_TICKET_ID, {
      assigneeEmail: null,
    }),
  );
});

it("history lists « Claude » « Déplacé vers En cours » « hier », newest first", async () => {
  vi.mocked(fetchEvents).mockResolvedValue([
    makeEvent("moved", "doing", {
      id: 2,
      actor: "claude",
      at: "2026-11-12T18:00:00",
    }),
    makeEvent("created", null, { id: 1 }),
  ]);
  renderAt(`/todo?ticket=${CLAUDE_TICKET_ID}`);
  const drawer = await screen.findByRole("dialog");
  const items = await within(drawer).findAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Claude");
  expect(items[0]).toHaveTextContent("Déplacé vers En cours");
  expect(items[0]).toHaveTextContent("hier");
  expect(items[1]).toHaveTextContent("CreniautB");
  expect(items[1]).toHaveTextContent("Créé");
});

it("description renders URLs as links", async () => {
  renderAt("/todo?ticket=3");
  const drawer = await screen.findByRole("dialog");
  expect(
    within(drawer).getByRole("link", {
      name: "https://notias.fr/mentions-legales",
    }),
  ).toHaveAttribute("href", "https://notias.fr/mentions-legales");
});

it("editing the description saves it on blur", async () => {
  renderAt("/todo?ticket=3");
  const drawer = await screen.findByRole("dialog");
  await userEvent.click(
    within(drawer).getByRole("button", { name: "Modifier" }),
  );
  const textarea = within(drawer).getByLabelText("Description");
  await userEvent.clear(textarea);
  await userEvent.type(textarea, "Nouveau texte");
  fireEvent.blur(textarea);
  await vi.waitFor(() =>
    expect(updateTicket).toHaveBeenCalledWith(3, {
      description: "Nouveau texte",
    }),
  );
});

it("« Supprimer » asks for confirmation, deletes and closes", async () => {
  renderAt("/todo/notia?ticket=3");
  const drawer = await screen.findByRole("dialog");
  await userEvent.click(
    within(drawer).getByRole("button", { name: "Supprimer" }),
  );
  const confirm = await screen.findByRole("alertdialog");
  expect(
    within(confirm).getByText(
      "Supprimer ce ticket ? Ses images seront supprimées aussi.",
    ),
  ).toBeInTheDocument();
  await userEvent.click(
    within(confirm).getByRole("button", { name: "Supprimer" }),
  );
  await vi.waitFor(() => expect(deleteTicket).toHaveBeenCalledWith(3));
  await vi.waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/todo\/notia$/),
  );
});

it("closing the drawer removes the ticket param", async () => {
  renderAt("/todo/notia?ticket=3");
  const drawer = await screen.findByRole("dialog");
  await userEvent.click(
    within(drawer).getByRole("button", { name: "Fermer le détail" }),
  );
  await vi.waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/todo\/notia$/),
  );
});
