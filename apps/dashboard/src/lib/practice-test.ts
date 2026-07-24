import { apiFetch } from './api/client'
import type { PracticeTestApiResponse } from '@/components/features/weekly-test/weekly-test-types'

export async function getPracticeTest(uuid: string): Promise<PracticeTestApiResponse> {
  return apiFetch<PracticeTestApiResponse>(`/v2/practice-test/${uuid}`)
}
