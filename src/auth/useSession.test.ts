import { renderHook, waitFor } from "@testing-library/react";
import { supabase } from "../lib/supabase";
import { useSession } from "./useSession";

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

it("is signed in with the session e-mail", async () => {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user: { email: "cb@example.com" } } },
    error: null,
  } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
  const { result } = renderHook(() => useSession());
  expect(result.current.status).toBe("loading");
  await waitFor(() =>
    expect(result.current).toEqual({
      status: "signedIn",
      email: "cb@example.com",
    }),
  );
});

it("is signed out without session", async () => {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: null,
  } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
  const { result } = renderHook(() => useSession());
  await waitFor(() =>
    expect(result.current).toEqual({ status: "signedOut", email: null }),
  );
});
