import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { AppRoutes } from "../AppRoutes";
import { makeFile, members, projects, tickets } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import { fetchBoard } from "./api";

vi.mock("./api", () => ({
  fetchBoard: vi.fn(),
  fetchEvents: vi.fn().mockResolvedValue([]),
  fetchImages: vi.fn().mockResolvedValue([]),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

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

const chip = async (name: RegExp) =>
  within(
    await screen.findByRole("group", { name: "Filtrer par projet" }),
  ).getByRole("button", { name });

const titles = () =>
  screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);

beforeEach(() => {
  vi.mocked(fetchBoard).mockResolvedValue({ projects, members, tickets });
});

it("/ redirects to /todo", async () => {
  renderAt("/");
  await screen.findByRole("heading", { name: "Tableau" });
  expect(screen.getByTestId("location")).toHaveTextContent("/todo");
});

it("/todo shows every ticket and « Tous les projets » with the total", async () => {
  renderAt("/todo");
  const all = await chip(/Tous les projets/);
  expect(all).toHaveAttribute("aria-pressed", "true");
  expect(all).toHaveTextContent(String(tickets.length));
  expect(titles()).toHaveLength(tickets.length);
});

it("/todo/notia shows only Notia tickets and marks the Notia chip pressed", async () => {
  renderAt("/todo/notia");
  const notia = await chip(/^Notia/);
  expect(notia).toHaveAttribute("aria-pressed", "true");
  expect(titles()).toHaveLength(
    tickets.filter((t) => t.projectSlug === "notia").length,
  );
  expect(
    screen.queryByText("Créer le projet Supabase"),
  ).not.toBeInTheDocument();
});

it("clicking the Back-office chip navigates to /todo/back-office", async () => {
  renderAt("/todo");
  await userEvent.click(await chip(/^Back-office/));
  expect(screen.getByTestId("location")).toHaveTextContent("/todo/back-office");
  expect(titles()).toEqual([
    "Créer le projet Supabase",
    "Valider la maquette du tableau",
    "Initialiser le repo",
  ]);
});

it("/todo/inconnu shows « Projet inconnu » and a « Voir tous les projets » link", async () => {
  renderAt("/todo/inconnu");
  expect(await screen.findByText("Projet inconnu")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Voir tous les projets" }),
  ).toHaveAttribute("href", "/todo");
});

it("header summary counts the filtered list", async () => {
  renderAt("/todo/notia");
  const notia = tickets.filter((t) => t.projectSlug === "notia");
  const doing = notia.filter((t) => t.status === "doing").length;
  expect(
    await screen.findByText(`${notia.length} tickets, ${doing} en cours`),
  ).toBeInTheDocument();
});

it("cards sit in their column, sorted by position", async () => {
  renderAt("/todo");
  const lane = await screen.findByRole("region", { name: "En cours" });
  expect(
    within(lane)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent),
  ).toEqual([
    "Repères : caler les scores sur une semaine de vrais joueurs",
    "Accueil : vérifier la direction E",
    "Valider la maquette du tableau",
  ]);
});

it("clicking a card sets ?ticket=<id>", async () => {
  renderAt("/todo/notia");
  await userEvent.click(
    await screen.findByText("Compléter les mentions légales"),
  );
  expect(screen.getByTestId("location")).toHaveTextContent(
    "/todo/notia?ticket=3",
  );
});

it("a board load error offers a retry", async () => {
  vi.mocked(fetchBoard).mockRejectedValue(new Error("réseau"));
  renderAt("/todo");
  expect(
    await screen.findByRole("button", { name: "Réessayer" }),
  ).toBeInTheDocument();
});

it("a failed background refetch keeps the board on screen", async () => {
  const { queryClient } = renderAt("/todo");
  await screen.findByRole("heading", { name: "Tableau" });
  vi.mocked(fetchBoard).mockRejectedValue(new Error("réseau"));
  await act(() => queryClient.refetchQueries({ queryKey: ["board"] }));
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
  expect(screen.getByRole("heading", { name: "Tableau" })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Réessayer" }),
  ).not.toBeInTheDocument();
});

it("dropping a file on the board does not make the browser leave the app", async () => {
  renderAt("/todo");
  const lane = await screen.findByRole("region", { name: "À faire" });
  const file = makeFile("capture.png", "image/png", 1000);
  const dataTransfer = { files: [file], types: ["Files"] };
  expect(fireEvent.dragOver(lane, { dataTransfer })).toBe(false);
  expect(fireEvent.drop(lane, { dataTransfer })).toBe(false);
});
