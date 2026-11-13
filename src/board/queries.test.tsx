import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toaster } from "../components/toaster";
import { members, projects, tickets } from "../test/fixtures";
import { createTestQueryClient } from "../test/render";
import { fetchBoard, updateTicket } from "./api";
import { boardKey, useUpdateTicket } from "./queries";
import type { Board } from "./types";

vi.mock("./api", () => ({
  fetchBoard: vi.fn(),
  updateTicket: vi.fn(),
}));
vi.mock("../components/toaster", () => ({ toaster: { create: vi.fn() } }));

const board: Board = { projects, members, tickets };

function setup() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(boardKey, board);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateTicket(), { wrapper });
  const statusOf = (id: number) =>
    queryClient.getQueryData<Board>(boardKey)?.tickets.find((t) => t.id === id)
      ?.status;
  return { result, statusOf };
}

beforeEach(() => {
  vi.mocked(fetchBoard).mockResolvedValue(board);
  vi.mocked(toaster.create).mockClear();
});

it("useUpdateTicket moves the card in the cache before the server answers", async () => {
  vi.mocked(updateTicket).mockReturnValue(new Promise(() => {}));
  const { result, statusOf } = setup();
  act(() =>
    result.current.mutate({ id: 3, patch: { status: "done", position: -1 } }),
  );
  await waitFor(() => expect(statusOf(3)).toBe("done"));
});

it("useUpdateTicket restores the card and shows « Modification non enregistrée » on error", async () => {
  vi.mocked(updateTicket).mockRejectedValue(new Error("JWT expired"));
  const { result, statusOf } = setup();
  act(() =>
    result.current.mutate({ id: 3, patch: { status: "done", position: -1 } }),
  );
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(statusOf(3)).toBe("todo");
  expect(toaster.create).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "error",
      title: "Modification non enregistrée",
    }),
  );
});
