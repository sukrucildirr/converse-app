import {
  QueryKey,
  queryOptions,
  skipToken,
  useQuery,
} from "@tanstack/react-query";
import { queryClient } from "../../queries/queryClient";
import { DateUtils } from "@/utils/time.utils";
import {
  searchProfiles,
  ISearchProfilesResult,
} from "@/features/profiles/profiles.search.api";

const profileSearchQueryKey = (args: { query: string }): QueryKey => [
  "profileSearch",
  args.query,
];

const profileSearchQueryConfig = (args: { query?: string }) => {
  const enabled = !!args.query && args.query.trim().length > 0;
  return queryOptions({
    enabled,
    queryKey: profileSearchQueryKey({ query: args.query! }),
    queryFn: enabled
      ? () => searchProfiles({ searchQuery: args.query! })
      : skipToken,
    gcTime: DateUtils.minutes.toMilliseconds(5),
    staleTime: DateUtils.minutes.toMilliseconds(5),
  });
};

export const useProfileSearchQuery = (args: { query?: string }) => {
  return useQuery(profileSearchQueryConfig(args));
};

export const prefetchProfileSearchQuery = (args: { query: string }) => {
  return queryClient.prefetchQuery(profileSearchQueryConfig(args));
};

export const fetchProfileSearchQuery = (args: { query: string }) => {
  return queryClient.fetchQuery<ISearchProfilesResult[]>(
    profileSearchQueryConfig(args)
  );
};

export const invalidateProfileSearchQuery = (args: { query: string }) => {
  queryClient.invalidateQueries({
    queryKey: profileSearchQueryKey(args),
  });
};
