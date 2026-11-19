import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { renderWithProviders } from "../test/render";
import { ThemeMenu } from "./ThemeMenu";

function renderMenu() {
  return renderWithProviders(
    <ThemeProvider attribute="class" defaultTheme="system">
      <ThemeMenu />
    </ThemeProvider>,
  );
}

async function choose(option: string) {
  await userEvent.click(screen.getByRole("button", { name: /^Thème :/ }));
  await userEvent.click(
    await screen.findByRole("menuitemradio", { name: option }),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

it("follows the system by default", () => {
  renderMenu();
  expect(
    screen.getByRole("button", { name: "Thème : Système" }),
  ).toBeInTheDocument();
});

it("« Sombre » darkens the page and is remembered", async () => {
  renderMenu();
  await choose("Sombre");
  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
  expect(
    screen.getByRole("button", { name: "Thème : Sombre" }),
  ).toBeInTheDocument();
});

it("« Clair » lightens the page", async () => {
  renderMenu();
  await choose("Sombre");
  await choose("Clair");
  expect(document.documentElement).toHaveClass("light");
  expect(document.documentElement).not.toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("light");
});

it("a saved choice comes back on reload", () => {
  localStorage.setItem("theme", "dark");
  renderMenu();
  expect(
    screen.getByRole("button", { name: "Thème : Sombre" }),
  ).toBeInTheDocument();
});
