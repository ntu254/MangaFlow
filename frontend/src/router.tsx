import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // refetchOnWindowFocus: "always" refetches active queries whenever the tab
  // regains focus, even within their staleTime window — so another user's
  // approvals/status changes show up on tab focus instead of needing a reload.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: "always" } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
