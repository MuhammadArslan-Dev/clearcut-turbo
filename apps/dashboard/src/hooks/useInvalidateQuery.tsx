// hooks/useInvalidateQuery.ts
"use client";

import { QueryKey, useQueryClient } from "@tanstack/react-query";

export function useInvalidateQuery(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey,
    });
  };
}
