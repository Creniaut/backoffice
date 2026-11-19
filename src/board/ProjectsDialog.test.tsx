import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { AppRoutes } from "../AppRoutes";
import { members, projects, tickets } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import { createProject, fetchBoard, updateProject } from "./api";
import { PROJECT_COLORS, PROJECT_EXISTS } from "./projects";
import type { Project } from "./types";

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

const ARCHIVED_AT = "2026-11-19T10:00:00Z";
let current: Project[] = projects;

function LocationDisplay() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname + location.search}
    </output>
  );
}

async function openDialog(route = "/todo") {
  renderWithProviders(
    <>
      <AppRoutes />
      <LocationDisplay />
    </>,
    { route },
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Gérer les projets" }),
  );
  return screen.findByRole("dialog", { name: "Projets" });
}

const row = (dialog: HTMLElement, list: string, name: string) =>
  within(within(dialog).getByRole("list", { name: list })).getByRole(
    "listitem",
    { name },
  );

const archiveNotia = () => {
  current = projects.map((p) =>
    p.slug === "notia" ? { ...p, archivedAt: ARCHIVED_AT } : p,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  current = projects;
  vi.mocked(fetchBoard).mockImplementation(async () => ({
    projects: current,
    members,
    tickets,
  }));
  vi.mocked(createProject).mockImplementation(async (input) => {
    current = [...current, { ...input, archivedAt: null }];
  });
  vi.mocked(updateProject).mockResolvedValue();
});

it("« Gérer les projets » opens the « Projets » window", async () => {
  const dialog = await openDialog();
  expect(
    within(dialog).getByRole("listitem", { name: "Notia" }),
  ).toHaveTextContent(
    `${tickets.filter((t) => t.projectSlug === "notia").length} tickets`,
  );
});

it("creates « Outil travaux » with the first free color and opens it", async () => {
  const dialog = await openDialog();
  await userEvent.type(within(dialog).getByLabelText("Nom"), "Outil travaux");
  expect(dialog).toHaveTextContent("Adresse : /todo/outil-travaux");
  await userEvent.click(within(dialog).getByRole("button", { name: "Créer" }));
  expect(createProject).toHaveBeenCalledWith({
    slug: "outil-travaux",
    name: "Outil travaux",
    color: PROJECT_COLORS[2],
  });
  await vi.waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/todo/outil-travaux",
    ),
  );
  expect(screen.queryByText("Projet inconnu")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("the chosen color is sent", async () => {
  const dialog = await openDialog();
  await userEvent.type(within(dialog).getByLabelText("Nom"), "Outil");
  await userEvent.click(
    within(
      within(dialog).getByRole("radiogroup", { name: "Couleur" }),
    ).getByRole("radio", { name: "Couleur 5" }),
  );
  await userEvent.click(within(dialog).getByRole("button", { name: "Créer" }));
  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ color: PROJECT_COLORS[4] }),
  );
});

it("a name without letters or digits keeps « Créer » disabled", async () => {
  const dialog = await openDialog();
  await userEvent.type(within(dialog).getByLabelText("Nom"), "!!!");
  expect(within(dialog).getByRole("button", { name: "Créer" })).toBeDisabled();
});

it("a name taken by a project says « Ce projet existe déjà »", async () => {
  const dialog = await openDialog();
  await userEvent.type(within(dialog).getByLabelText("Nom"), "notia");
  expect(dialog).toHaveTextContent(PROJECT_EXISTS);
  expect(within(dialog).getByRole("button", { name: "Créer" })).toBeDisabled();
});

it("a name taken by an archived project is refused too", async () => {
  archiveNotia();
  const dialog = await openDialog();
  await userEvent.type(within(dialog).getByLabelText("Nom"), "Notia");
  expect(dialog).toHaveTextContent(PROJECT_EXISTS);
  expect(within(dialog).getByRole("button", { name: "Créer" })).toBeDisabled();
});

it("a duplicate reported by the database shows in the window", async () => {
  vi.mocked(createProject).mockRejectedValue(new Error(PROJECT_EXISTS));
  const dialog = await openDialog();
  await userEvent.type(within(dialog).getByLabelText("Nom"), "Nouveau");
  await userEvent.click(within(dialog).getByRole("button", { name: "Créer" }));
  expect(await within(dialog).findByText(PROJECT_EXISTS)).toBeInTheDocument();
});

it("« Modifier » renames and recolors a project", async () => {
  const dialog = await openDialog();
  const notia = row(dialog, "Projets actifs", "Notia");
  await userEvent.click(
    within(notia).getByRole("button", { name: "Modifier" }),
  );
  const name = within(notia).getByLabelText("Nom du projet");
  await userEvent.clear(name);
  await userEvent.type(name, "  Notia 2 ");
  await userEvent.click(
    within(notia).getByRole("radio", { name: "Couleur 4" }),
  );
  await userEvent.click(
    within(notia).getByRole("button", { name: "Enregistrer" }),
  );
  expect(updateProject).toHaveBeenCalledWith("notia", {
    name: "Notia 2",
    color: PROJECT_COLORS[3],
  });
});

it("« Enregistrer » stays disabled with a blank name", async () => {
  const dialog = await openDialog();
  const notia = row(dialog, "Projets actifs", "Notia");
  await userEvent.click(
    within(notia).getByRole("button", { name: "Modifier" }),
  );
  const name = within(notia).getByLabelText("Nom du projet");
  await userEvent.clear(name);
  await userEvent.type(name, "   ");
  expect(
    within(notia).getByRole("button", { name: "Enregistrer" }),
  ).toBeDisabled();
});

it("« Archiver » stamps the project", async () => {
  const dialog = await openDialog();
  await userEvent.click(
    within(row(dialog, "Projets actifs", "Notia")).getByRole("button", {
      name: "Archiver",
    }),
  );
  expect(updateProject).toHaveBeenCalledWith("notia", {
    archivedAt: expect.any(String),
  });
});

it("archived projects fold under « Archivés (1) » and can be restored", async () => {
  archiveNotia();
  const dialog = await openDialog();
  expect(
    within(dialog).queryByRole("list", { name: "Projets archivés" }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Archivés (1)" }),
  );
  await userEvent.click(
    within(row(dialog, "Projets archivés", "Notia")).getByRole("button", {
      name: "Restaurer",
    }),
  );
  expect(updateProject).toHaveBeenCalledWith("notia", { archivedAt: null });
});

it("no archived project, no « Archivés » section", async () => {
  const dialog = await openDialog();
  expect(
    within(dialog).queryByRole("button", { name: /^Archivés/ }),
  ).not.toBeInTheDocument();
});
