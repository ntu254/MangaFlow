import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // refetchOnWindowFocus: "always" refetches active queries whenever the tab
  // regains focus, even within their staleTime window — so another user's
  // approvals/status changes show up on tab focus instead of needing a reload.
  let queryClient!: QueryClient;
  const mutationCache = new MutationCache({
    // Keep every active screen in sync even when a feature mutation misses
    // a feature-specific query key. Individual mutations may still narrow
    // this with targeted invalidation, but no successful API action leaves
    // active UI data stale.
    // A failed command can still mean another client changed the resource;
    // refresh on both success and error so conflict/error states do not leave
    // the active screen stale.
    onSettled: () => queryClient.invalidateQueries({ refetchType: "active" }),
  });
  queryClient = new QueryClient({
    mutationCache,
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
