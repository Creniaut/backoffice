import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { system } from "../theme";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  opts?: { route?: string; queryClient?: QueryClient },
): RenderResult & { queryClient: QueryClient } {
  const queryClient = opts?.queryClient ?? createTestQueryClient();
  const result = render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[opts?.route ?? "/todo"]}>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>,
  );
  return { ...result, queryClient };
}
