import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toaster } from "../components/toaster";
import {
  createTicket,
  deleteImage,
  deleteTicket,
  fetchBoard,
  fetchEvents,
  fetchImages,
  updateTicket,
  uploadImage,
} from "./api";
import type { Board, TicketImage, TicketPatch } from "./types";

export const boardKey = ["board"] as const;
export const eventsKey = (id: number) => ["events", id] as const;
export const imagesKey = (id: number) => ["images", id] as const;

const SIGNED_URL_STALE_MS = 30 * 60_000;

function fail(title: string) {
  toaster.create({ type: "error", title });
}

function refreshTicket(queryClient: QueryClient, id: number) {
  void queryClient.invalidateQueries({ queryKey: boardKey });
  void queryClient.invalidateQueries({ queryKey: eventsKey(id) });
}

export function useBoard() {
  return useQuery({ queryKey: boardKey, queryFn: fetchBoard });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: TicketPatch }) =>
      updateTicket(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previous = queryClient.getQueryData<Board>(boardKey);
      if (previous) {
        queryClient.setQueryData<Board>(boardKey, {
          ...previous,
          tickets: previous.tickets.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKey, context.previous);
      }
      fail("Modification non enregistrée");
    },
    onSettled: (_data, _error, { id }) => refreshTicket(queryClient, id),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createTicket>[0]) =>
      createTicket(input),
    onError: () => fail("Ticket non créé"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardKey }),
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTicket(id),
    onError: () => fail("Ticket non supprimé"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardKey }),
  });
}

export function useTicketEvents(id: number | null) {
  return useQuery({
    queryKey: eventsKey(id ?? -1),
    queryFn: () => fetchEvents(id as number),
    enabled: id !== null,
  });
}

export function useTicketImages(id: number | null) {
  return useQuery({
    queryKey: imagesKey(id ?? -1),
    queryFn: () => fetchImages(id as number),
    enabled: id !== null,
    staleTime: SIGNED_URL_STALE_MS,
  });
}

export function useUploadImage(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadImage(ticketId, file),
    onError: (error) =>
      toaster.create({
        type: "error",
        title: "Image non ajoutée",
        description: error.message,
      }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: imagesKey(ticketId) });
      void queryClient.invalidateQueries({ queryKey: boardKey });
    },
  });
}

export function useDeleteImage(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (image: TicketImage) => deleteImage(image),
    onError: () => fail("Image non supprimée"),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: imagesKey(ticketId) });
      void queryClient.invalidateQueries({ queryKey: boardKey });
    },
  });
}
