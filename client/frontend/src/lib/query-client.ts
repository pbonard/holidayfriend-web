import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, set a staleTime above 0 so the client doesn't
        // immediately refetch data that was just rendered on the server.
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Also dehydrate pending queries so prefetches can be streamed.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new client so data isn't shared between requests.
    return makeQueryClient();
  }
  // Browser: reuse one client so React suspending during the initial
  // render doesn't throw it away.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
