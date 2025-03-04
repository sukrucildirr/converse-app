import { Mutation, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { captureError } from "@/utils/capture-error"
import { ReactQueryError } from "@/utils/error"
import { logger } from "@/utils/logger"
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from "./queryClient.constants"

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (
      error: Error,
      variables: unknown,
      context: unknown,
      mutation: Mutation<unknown, unknown, unknown, unknown>,
    ) => {
      const extras: Record<string, string> = {
        type: "mutation",
        mutationKey: mutation.options.mutationKey
          ? JSON.stringify(mutation.options.mutationKey)
          : "",
      }

      if (mutation.meta?.caller) {
        extras.caller = mutation.meta.caller as string
      }

      if (variables) {
        extras.variables = JSON.stringify(variables)
      }

      // Wrap the error in ReactQueryError
      const wrappedError = new ReactQueryError({
        error,
        additionalMessage: `Mutation failed: ${mutation.options.mutationKey ?? "unknown"}`,
      })

      captureError(wrappedError, { extras })
    },
  }),
  queryCache: new QueryCache({
    // Used to track which queries execute the queryFn which means will do a network request.
    // Carefull, this is also triggered when the query gets its data from the persister.
    onSuccess: (_, query) => {
      logger.debug(
        `[Query] success fetching ${JSON.stringify(query.queryKey)}${
          query.meta?.caller ? ` (caller: ${query.meta.caller})` : ""
        }`,
      )
    },
    onError: (error: Error, query) => {
      const extras: Record<string, string> = {
        type: "query",
        queryKey: JSON.stringify(query.queryKey),
      }

      if (query.meta?.caller) {
        extras.caller = query.meta.caller as string
      }

      // Wrap the error in ReactQueryError
      const wrappedError = new ReactQueryError({
        error,
        additionalMessage: `Query failed: ${JSON.stringify(query.queryKey)}`,
      })

      captureError(wrappedError, { extras })
    },
  }),

  defaultOptions: {
    queries: {
      gcTime: DEFAULT_GC_TIME,
      staleTime: DEFAULT_STALE_TIME,

      // For now let's control our retries
      retry: false,

      // For now let's control our retries
      retryOnMount: false,

      // Prevent infinite refetch loops by manually controlling when queries should refetch when components mount
      refetchOnMount: false,

      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      // Offers better performance by avoiding deep equality checks
      structuralSharing: false,
    },
  },
})
