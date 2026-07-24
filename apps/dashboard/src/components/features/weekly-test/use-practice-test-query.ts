'use client'
import { useQuery } from '@tanstack/react-query'
import { getPracticeTest } from '@/lib/practice-test'
import { sentryApiClient } from '@/lib/sentry/sentry-api-client'
import type { ApiPracticeTest } from './weekly-test-types'

export const PRACTICE_TEST_KEY = (uuid: string) => ['practice-test', uuid] as const

export function usePracticeTestQuery(uuid: string) {
  return useQuery<ApiPracticeTest>({
    queryKey: PRACTICE_TEST_KEY(uuid),
    queryFn: () =>
      sentryApiClient(
        () => getPracticeTest(uuid).then((res) => res.data),
        { endpoint: '/v2/practice-test', module: 'weekly-test' },
      ),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
