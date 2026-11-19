import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { AppRoutes } from "../AppRoutes";
import { makeTicket, members, projects, tickets } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import { createTicket, fetchBoard } from "./api";

vi.mock("./api", () => ({
  fetchBoard: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  fetchEvents: vi.fn().mockResolvedValue([]),
  fetchImages: vi.fn().mockResolvedValue([]),
  createTicket: vi.fn(),
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
  vi.mocked(fetchBoard).mockResolvedValue({ projects, members, tickets });
});

it("« + » of « En cours » on /todo/notia prefills Colonne = En cours and Projet = Notia", async () => {
  renderAt("/todo/notia");
  await userEvent.click(
    await screen.findByRole("button", { name: "Ajouter dans En cours" }),
  );
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByLabelText("Colonne")).toHaveValue("doing");
  expect(within(dialog).getByLabelText("Projet")).toHaveValue("notia");
});

it("« Nouveau ticket » on /todo prefills Colonne = À faire and no project", async () => {
  renderAt("/todo");
  await userEvent.click(
    await screen.findByRole("button", { name: "Nouveau ticket" }),
  );
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByLabelText("Colonne")).toHaveValue("todo");
  expect(within(dialog).getByLabelText("Projet")).toHaveValue("");
});

it("« Créer » stays disabled until title and project are set", async () => {
  renderAt("/todo");
  await userEvent.click(
    await screen.findByRole("button", { name: "Nouveau ticket" }),
  );
  const dialog = await screen.findByRole("dialog");
  const create = within(dialog).getByRole("button", { name: "Créer" });
  expect(create).toBeDisabled();
  await userEvent.type(within(dialog).getByLabelText("Titre"), "   ");
  await userEvent.selectOptions(
    within(dialog).getByLabelText("Projet"),
    "notia",
  );
  expect(create).toBeDisabled();
  await userEvent.type(within(dialog).getByLabelText("Titre"), "Nouveau sujet");
  expect(create).toBeEnabled();
});

it("creating inserts at the top of the column and opens the new ticket", async () => {
  const created = makeTicket(42, "notia", "doing", 1, "Nouveau sujet", {
    description: "Détails",
    assigneeEmail: "ec@example.com",
  });
  vi.mocked(createTicket).mockResolvedValue(created);
  renderAt("/todo/notia");
  await userEvent.click(
    await screen.findByRole("button", { name: "Ajouter dans En cours" }),
  );
  const dialog = await screen.findByRole("dialog");
  await userEvent.type(
    within(dialog).getByLabelText("Titre"),
    " Nouveau sujet ",
  );
  await userEvent.type(within(dialog).getByLabelText("Description"), "Détails");
  await userEvent.selectOptions(
    within(dialog).getByLabelText("Qui s'en occupe"),
    "ec@example.com",
  );
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: [...tickets, created],
  });
  await userEvent.click(within(dialog).getByRole("button", { name: "Créer" }));
  await vi.waitFor(() =>
    expect(createTicket).toHaveBeenCalledWith({
      projectSlug: "notia",
      title: "Nouveau sujet",
      description: "Détails",
      status: "doing",
      assigneeEmail: "ec@example.com",
      position: 1,
      priority: null,
      difficulty: null,
    }),
  );
  await vi.waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/todo/notia?ticket=42",
    ),
  );
  expect(
    await screen.findByRole("dialog", { name: "Nouveau sujet" }),
  ).toBeInTheDocument();
});

it("creating sends the chosen priority and difficulty", async () => {
  vi.mocked(createTicket).mockResolvedValue(
    makeTicket(43, "notia", "todo", 0, "Prioritaire"),
  );
  renderAt("/todo/notia");
  await userEvent.click(
    await screen.findByRole("button", { name: "Nouveau ticket" }),
  );
  const dialog = await screen.findByRole("dialog");
  await userEvent.type(within(dialog).getByLabelText("Titre"), "Prioritaire");
  await userEvent.selectOptions(
    within(dialog).getByLabelText("Priorité"),
    "high",
  );
  await userEvent.selectOptions(
    within(dialog).getByLabelText("Difficulté"),
    "hard",
  );
  await userEvent.click(within(dialog).getByRole("button", { name: "Créer" }));
  await vi.waitFor(() =>
    expect(createTicket).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "high", difficulty: "hard" }),
    ),
  );
});

it("« Projet » does not list archived projects", async () => {
  vi.mocked(fetchBoard).mockResolvedValue({
    projects: projects.map((p) =>
      p.slug === "notia" ? { ...p, archivedAt: "2026-11-19T10:00:00Z" } : p,
    ),
    members,
    tickets,
  });
  renderAt("/todo");
  await userEvent.click(
    await screen.findByRole("button", { name: "Nouveau ticket" }),
  );
  const dialog = await screen.findByRole("dialog");
  const options = within(within(dialog).getByLabelText("Projet"))
    .getAllByRole("option")
    .map((o) => o.getAttribute("value"));
  expect(options).toEqual(["", "back-office"]);
});
