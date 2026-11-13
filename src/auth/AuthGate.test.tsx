import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fetchIsMember } from "../board/api";
import { supabase } from "../lib/supabase";
import { renderWithProviders } from "../test/render";
import { AuthGate } from "./AuthGate";
import { useSession } from "./useSession";

vi.mock("./useSession", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./useSession")>()),
  useSession: vi.fn(),
}));
vi.mock("../board/api", () => ({ fetchIsMember: vi.fn() }));
vi.mock("../lib/supabase", () => ({
  supabase: { auth: { signInWithOAuth: vi.fn(), signOut: vi.fn() } },
}));

function renderGate() {
  return renderWithProviders(
    <AuthGate>
      <p>Contenu du tableau</p>
    </AuthGate>,
  );
}

beforeEach(() => vi.clearAllMocks());

it("signed out: shows the Google button and starts the Google sign-in", async () => {
  vi.mocked(useSession).mockReturnValue({ status: "signedOut", email: null });
  renderGate();
  await userEvent.click(
    screen.getByRole("button", { name: "Se connecter avec Google" }),
  );
  expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "google" }),
  );
  expect(screen.queryByText("Contenu du tableau")).not.toBeInTheDocument();
});

it("non-member: shows « Accès réservé », the e-mail and « Se déconnecter », never the board", async () => {
  vi.mocked(useSession).mockReturnValue({
    status: "signedIn",
    email: "intrus@example.com",
  });
  vi.mocked(fetchIsMember).mockResolvedValue(false);
  renderGate();
  expect(await screen.findByText("Accès réservé")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Le compte intrus@example.com n'a pas accès à ce back-office.",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText("Contenu du tableau")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));
  expect(supabase.auth.signOut).toHaveBeenCalled();
});

it("member: renders children", async () => {
  vi.mocked(useSession).mockReturnValue({
    status: "signedIn",
    email: "cb@example.com",
  });
  vi.mocked(fetchIsMember).mockResolvedValue(true);
  renderGate();
  expect(await screen.findByText("Contenu du tableau")).toBeInTheDocument();
  expect(fetchIsMember).toHaveBeenCalledWith("cb@example.com");
});

it("membership check failure offers a retry instead of the board", async () => {
  vi.mocked(useSession).mockReturnValue({
    status: "signedIn",
    email: "cb@example.com",
  });
  vi.mocked(fetchIsMember).mockRejectedValue(new Error("réseau"));
  renderGate();
  expect(
    await screen.findByRole("button", { name: "Réessayer" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Contenu du tableau")).not.toBeInTheDocument();
});

it("a failed membership re-check keeps a member on the board", async () => {
  vi.mocked(useSession).mockReturnValue({
    status: "signedIn",
    email: "cb@example.com",
  });
  vi.mocked(fetchIsMember).mockResolvedValue(true);
  const { queryClient } = renderGate();
  await screen.findByText("Contenu du tableau");
  vi.mocked(fetchIsMember).mockRejectedValue(new Error("réseau"));
  await act(() => queryClient.refetchQueries({ queryKey: ["member"] }));
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
  expect(screen.getByText("Contenu du tableau")).toBeInTheDocument();
});
