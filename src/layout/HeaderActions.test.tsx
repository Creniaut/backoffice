import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fetchBoard } from "../board/api";
import { supabase } from "../lib/supabase";
import { members, projects, tickets } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import { HeaderActions } from "./HeaderActions";

vi.mock("../board/api", () => ({ fetchBoard: vi.fn() }));
vi.mock("../lib/supabase", () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

it("shows the members' initials and signs out", async () => {
  vi.mocked(fetchBoard).mockResolvedValue({ projects, members, tickets });
  renderWithProviders(<HeaderActions />);
  expect(await screen.findByText("CB")).toHaveAttribute("title", "CreniautB");
  expect(screen.getByText("EC")).toHaveAttribute("title", "EmilienCR");
  await userEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));
  expect(supabase.auth.signOut).toHaveBeenCalled();
});
