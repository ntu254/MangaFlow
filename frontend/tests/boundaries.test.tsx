import tsx from "@tanstack/react-router-devtools";
const reactQueryDevtools =
  process.env.NODE_ENV !== "production"
    ? await import("@tanstack/react-query-devtools")
    : () => null;

import type { ReactNode } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./app";

import "./styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 1000 * 60 * 5,
      },
    },
  });
}

function AppRoot() {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
      {process.env.NODE_ENV !== "production" && <ReactQueryDevtools />}
      {process.env.NODE_ENV !== "production" && <ReactRouterDevtools />}
    </QueryClientProvider>
  );
}

const devtools = process.env.NODE_ENV !== "production" ? [tsx.ReactRouterDevtools] : [];

createRoot(document.getElementById("app")!).render(<AppRoot />);
