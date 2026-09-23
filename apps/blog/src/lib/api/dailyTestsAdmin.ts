// Admin-only calls backing the "Daily-Tests" tab in (admin)/admin — thin
// wrappers around the Laravel admin endpoints in
// routes/Apis/V2/admin.php (DailyTestAdminController). Generation is fully
// automated and enrollment-driven — triggered by n8n calling the backend's
// automation API, by a user opening Daily Tests, or by enrollment itself,
// never by a Laravel cron. There is no per-exam enable/disable switch left
// to toggle; this screen shows automation status + recent runs instead.
import api from "@/api/axios";

export interface DailyTestCutoffSetting {
  exam_id: number;
  name: string;
  short_name: string;
  expected_cutoff: string | null;
}

export interface DailyTestGenerationRun {
  id: number;
  run_date: string;
  timezone: string;
  started_at: string;
  completed_at: string | null;
  users_scanned: number;
  eligible_users: number;
  tests_generated: number;
  assignments_created: number;
  duplicates_prevented: number;
  skipped: number;
  failed: number;
}

export interface DailyTestAutomationStatus {
  generation_trigger: string;
  notification_time: string;
  timezone: string;
  questions_per_test: number;
  last_run: DailyTestGenerationRun | null;
  exams: DailyTestCutoffSetting[];
}

export async function getDailyTestAutomationStatus(): Promise<DailyTestAutomationStatus> {
  const res = await api.get("/v2/admin/daily-tests");
  return res.data.data;
}

export async function getDailyTestGenerationLogs(limit = 20): Promise<DailyTestGenerationRun[]> {
  const res = await api.get("/v2/admin/daily-tests/logs", { params: { limit } });
  return res.data.data;
}

export async function updateExpectedCutoff(
  examId: number,
  expected_cutoff: string | null,
): Promise<void> {
  await api.post(`/v2/admin/daily-tests/${examId}`, { expected_cutoff });
}

export async function generateDailyTestsNow(): Promise<{ generated_count: number }> {
  const res = await api.post("/v2/admin/daily-tests/generate-now");
  return res.data.data;
}
