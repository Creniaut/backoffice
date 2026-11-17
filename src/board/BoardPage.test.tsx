import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { AppRoutes } from "../AppRoutes";
import {
  makeFile,
  makeTicket,
  members,
  projects,
  tickets,
} from "../test/fixtures";
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
    await screen.findByRole("radiogroup", { name: "Filtrer par projet" }),
  ).getByRole("radio", { name });

const titles = () =>
  screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);

const laneTitles = (lane: string) =>
  within(screen.getByRole("region", { name: lane }))
    .queryAllByRole("heading", { level: 3 })
    .map((h) => h.textContent);

const sortBy = async (name: string) => {
  await userEvent.click(screen.getByRole("button", { name: /^Tri :/ }));
  await userEvent.click(await screen.findByRole("menuitemradio", { name }));
};

const check = async (menu: RegExp, option: RegExp) => {
  await userEvent.click(screen.getByRole("button", { name: menu }));
  await userEvent.click(
    await screen.findByRole("menuitemcheckbox", { name: option }),
  );
  await userEvent.keyboard("{Escape}");
};

const leveled = [
  makeTicket(61, "notia", "todo", 0, "Haute facile", {
    priority: "high",
    difficulty: "easy",
  }),
  makeTicket(62, "notia", "todo", 1, "Basse difficile", {
    priority: "low",
    difficulty: "hard",
  }),
  makeTicket(63, "notia", "todo", 2, "Sans niveau"),
  makeTicket(64, "back-office", "todo", 3, "Haute ailleurs", {
    priority: "high",
  }),
];

beforeEach(() => {
  vi.mocked(fetchBoard).mockResolvedValue({ projects, members, tickets });
});

afterEach(() => localStorage.clear());

it("/ redirects to /todo", async () => {
  renderAt("/");
  await screen.findByRole("heading", { name: "Tableau" });
  expect(screen.getByTestId("location")).toHaveTextContent("/todo");
});

it("/todo shows every ticket and « Tous les projets » with the total", async () => {
  renderAt("/todo");
  const all = await chip(/Tous les projets/);
  expect(all).toBeChecked();
  expect(all).toHaveAccessibleName(`Tous les projets ${tickets.length}`);
  expect(titles()).toHaveLength(tickets.length);
});

it("/todo/notia shows only Notia tickets and marks the Notia chip pressed", async () => {
  renderAt("/todo/notia");
  const notia = await chip(/^Notia/);
  expect(notia).toBeChecked();
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
  await vi.waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/todo/back-office",
    ),
  );
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

it("the toolbar shows no ticket count and reads « Tri : Manuel »", async () => {
  renderAt("/todo/notia");
  expect(
    await screen.findByRole("button", { name: /^Tri : Manuel/ }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/tickets · /)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Effacer les filtres" }),
  ).not.toBeInTheDocument();
});

it("« Priorité » keeps the checked levels, « Sans priorité » included, and remembers them", async () => {
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: leveled,
  });
  const { unmount } = renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Sans niveau" });
  await userEvent.click(screen.getByRole("button", { name: /^Priorité/ }));
  await userEvent.click(
    await screen.findByRole("menuitemcheckbox", { name: /^Priorité haute/ }),
  );
  await userEvent.click(
    screen.getByRole("menuitemcheckbox", { name: /^Sans priorité/ }),
  );
  await userEvent.keyboard("{Escape}");
  const expected = ["Haute facile", "Sans niveau", "Haute ailleurs"];
  expect(laneTitles("À faire")).toEqual(expected);
  expect(screen.getByRole("button", { name: /^Priorité/ })).toHaveTextContent(
    "2",
  );
  expect(JSON.parse(localStorage.getItem("board-filters") ?? "")).toEqual({
    priorities: ["high", "none"],
    difficulties: [],
  });

  unmount();
  renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Sans niveau" });
  expect(laneTitles("À faire")).toEqual(expected);
});

it("« Difficulté » narrows what « Priorité » keeps", async () => {
  localStorage.setItem(
    "board-filters",
    JSON.stringify({ priorities: ["high"], difficulties: [] }),
  );
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: leveled,
  });
  renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Haute ailleurs" });
  await check(/^Difficulté/, /^Difficulté facile/);
  expect(laneTitles("À faire")).toEqual(["Haute facile"]);
});

it("the menus count the tickets of the selected project", async () => {
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: leveled,
  });
  renderAt("/todo/notia");
  await screen.findByRole("heading", { level: 3, name: "Sans niveau" });
  await userEvent.click(screen.getByRole("button", { name: /^Priorité/ }));
  const high = await screen.findByRole("menuitemcheckbox", {
    name: /^Priorité haute/,
  });
  expect(within(high).getByText("1")).toBeInTheDocument();
});

it("« Effacer les filtres » shows every ticket again", async () => {
  localStorage.setItem(
    "board-filters",
    JSON.stringify({ priorities: ["low"], difficulties: ["hard"] }),
  );
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: leveled,
  });
  renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Basse difficile" });
  expect(laneTitles("À faire")).toEqual(["Basse difficile"]);
  await userEvent.click(
    screen.getByRole("button", { name: "Effacer les filtres" }),
  );
  expect(laneTitles("À faire")).toHaveLength(leveled.length);
  expect(
    screen.queryByRole("button", { name: "Effacer les filtres" }),
  ).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("board-filters") ?? "")).toEqual({
    priorities: [],
    difficulties: [],
  });
});

it("« Tout afficher » clears its own menu and keeps the other filter", async () => {
  localStorage.setItem(
    "board-filters",
    JSON.stringify({ priorities: ["low"], difficulties: ["none"] }),
  );
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: leveled,
  });
  renderAt("/todo");
  await screen.findByRole("region", { name: "À faire" });
  await userEvent.click(screen.getByRole("button", { name: /^Priorité/ }));
  await userEvent.click(
    await screen.findByRole("menuitem", { name: "Tout afficher" }),
  );
  expect(laneTitles("À faire")).toEqual(["Sans niveau", "Haute ailleurs"]);
  expect(JSON.parse(localStorage.getItem("board-filters") ?? "")).toEqual({
    priorities: [],
    difficulties: ["none"],
  });
});

it("a column the filters empty says so", async () => {
  localStorage.setItem(
    "board-filters",
    JSON.stringify({ priorities: ["medium"], difficulties: [] }),
  );
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: leveled,
  });
  renderAt("/todo");
  const lane = await screen.findByRole("region", { name: "À faire" });
  expect(
    within(lane).getByText("Aucun ticket pour ces filtres."),
  ).toBeInTheDocument();
  expect(within(lane).queryByText("Aucun ticket ici.")).not.toBeInTheDocument();
});

it("« Difficulté » ranks cards by difficulty, then priority", async () => {
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: [
      makeTicket(51, "notia", "todo", 0, "Difficile", { difficulty: "hard" }),
      makeTicket(52, "notia", "todo", 1, "Sans difficulté"),
      makeTicket(53, "notia", "todo", 2, "Facile basse", {
        difficulty: "easy",
        priority: "low",
      }),
      makeTicket(54, "notia", "todo", 3, "Facile haute", {
        difficulty: "easy",
        priority: "high",
      }),
    ],
  });
  renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Difficile" });
  await sortBy("Difficulté");
  expect(laneTitles("À faire")).toEqual([
    "Facile haute",
    "Facile basse",
    "Difficile",
    "Sans difficulté",
  ]);
  expect(
    screen.getByRole("button", { name: /^Tri : Difficulté/ }),
  ).toBeInTheDocument();
  expect(localStorage.getItem("board-sort")).toBe("difficulty");
});

it("an empty column says so and « Ajouter » creates a ticket in it", async () => {
  renderAt("/todo/back-office");
  const lane = await screen.findByRole("region", { name: "Idées" });
  expect(within(lane).getByText("Aucun ticket ici.")).toBeInTheDocument();
  await userEvent.click(within(lane).getByRole("button", { name: "Ajouter" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByLabelText("Colonne")).toHaveValue("idea");
});

it("« Fait » shows the 5 most recent and unfolds the older ones", async () => {
  const done = Array.from({ length: 7 }, (_, i) =>
    makeTicket(100 + i, "notia", "done", i, `Fait ${i + 1}`),
  );
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: done,
  });
  renderAt("/todo");
  const lane = await screen.findByRole("region", { name: "Fait" });
  const shown = () =>
    within(lane)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
  expect(shown()).toEqual(["Fait 1", "Fait 2", "Fait 3", "Fait 4", "Fait 5"]);
  await userEvent.click(
    within(lane).getByRole("button", { name: "Voir les 2 plus anciens" }),
  );
  expect(shown()).toHaveLength(7);
  await userEvent.click(
    within(lane).getByRole("button", { name: "Masquer les plus anciens" }),
  );
  expect(shown()).toHaveLength(5);
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

it("« Tri : Priorité » ranks cards by priority and is remembered", async () => {
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: [
      makeTicket(31, "notia", "todo", 0, "Basse", { priority: "low" }),
      makeTicket(32, "notia", "todo", 1, "Sans priorité"),
      makeTicket(33, "notia", "todo", 2, "Haute", { priority: "high" }),
    ],
  });
  const { unmount } = renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Haute" });
  expect(laneTitles("À faire")).toEqual(["Basse", "Sans priorité", "Haute"]);

  await sortBy("Priorité");
  expect(laneTitles("À faire")).toEqual(["Haute", "Basse", "Sans priorité"]);
  expect(localStorage.getItem("board-sort")).toBe("priority");

  unmount();
  renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Haute" });
  expect(laneTitles("À faire")).toEqual(["Haute", "Basse", "Sans priorité"]);
});

it("« Fait » keeps the most recent first in priority mode", async () => {
  localStorage.setItem("board-sort", "priority");
  vi.mocked(fetchBoard).mockResolvedValue({
    projects,
    members,
    tickets: [
      makeTicket(41, "notia", "done", 0, "Récent", { priority: "low" }),
      makeTicket(42, "notia", "done", 1, "Ancien", { priority: "high" }),
    ],
  });
  renderAt("/todo");
  await screen.findByRole("heading", { level: 3, name: "Récent" });
  expect(
    within(screen.getByRole("region", { name: "Fait" }))
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent),
  ).toEqual(["Récent", "Ancien"]);
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
