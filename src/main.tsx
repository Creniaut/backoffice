import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { AppToaster } from "./components/AppToaster";
import { system } from "./theme";

const queryClient = new QueryClient();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <AppToaster />
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ChakraProvider>
  </StrictMode>,
);
