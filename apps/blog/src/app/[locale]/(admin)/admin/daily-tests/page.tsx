"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useAuthStore } from "@/lib/auth";
import {
  DailyTestAutomationStatus,
  DailyTestCutoffSetting,
  DailyTestGenerationRun,
  generateDailyTestsNow,
  getDailyTestAutomationStatus,
  getDailyTestGenerationLogs,
  updateExpectedCutoff,
} from "@/lib/api/dailyTestsAdmin";

export default function DailyTestsAdminPage() {
  const { token, loading: authLoading } = useAuth();
  const { goToLogin } = useAuthStore();

  const [status, setStatus] = useState<DailyTestAutomationStatus | null>(null);
  const [logs, setLogs] = useState<DailyTestGenerationRun[]>([]);
  const [exams, setExams] = useState<DailyTestCutoffSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getDailyTestAutomationStatus(), getDailyTestGenerationLogs()])
      .then(([statusRes, logsRes]) => {
        setStatus(statusRes);
        setExams(statusRes.exams);
        setLogs(logsRes);
      })
      .catch(() => setError("Failed to load Daily Test status. Is the backend reachable?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const handleCutoffChange = (exam: DailyTestCutoffSetting, value: string) => {
    setExams((prev) =>
      prev.map((e) => (e.exam_id === exam.exam_id ? { ...e, expected_cutoff: value || null } : e)),
    );
  };

  const handleCutoffBlur = async (exam: DailyTestCutoffSetting) => {
    try {
      await updateExpectedCutoff(exam.exam_id, exam.expected_cutoff);
    } catch {
      setError(`Failed to save expected cutoff for "${exam.short_name}".`);
    }
  };

  const handleGenerateNow = async () => {
    setGenerating(true);
    setNotice(null);
    try {
      const { generated_count } = await generateDailyTestsNow();
      setNotice(`Generated ${generated_count} new daily test(s) for today.`);
      load();
    } catch {
      setError("Failed to generate today's tests.");
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading) {
    return <p className="text-sm text-gray-500">Checking your session…</p>;
  }

  if (!token) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-gray-600">You need to be logged in to manage Daily Tests.</p>
        <button
          onClick={() => goToLogin()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Daily Tests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Daily Tests are fully automated: every enrolled user gets a shared, chapter-based test
          for their next rotation section, generated server-side — there is nothing left to enable
          or disable per exam.
        </p>
      </div>

      {notice && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading || !status ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Automation</h2>
              <button
                onClick={handleGenerateNow}
                disabled={generating}
                className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {generating ? "Generating…" : "Generate Now"}
              </button>
            </div>
            <dl className="mb-3 text-sm">
              <dt className="text-gray-500">Generation trigger</dt>
              <dd className="font-medium">{status.generation_trigger}</dd>
            </dl>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-gray-500">Notifications</dt>
                <dd className="font-medium">{status.notification_time}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Timezone</dt>
                <dd className="font-medium">{status.timezone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Questions / test</dt>
                <dd className="font-medium">{status.questions_per_test}</dd>
              </div>
            </dl>
          </div>

          <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              Recent generation runs
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Eligible</th>
                  <th className="px-4 py-2 font-medium">Tests</th>
                  <th className="px-4 py-2 font-medium">Assignments</th>
                  <th className="px-4 py-2 font-medium">Skipped</th>
                  <th className="px-4 py-2 font-medium">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-gray-400">
                      No generation runs recorded yet.
                    </td>
                  </tr>
                )}
                {logs.map((run) => (
                  <tr key={run.id}>
                    <td className="px-4 py-2">{run.run_date}</td>
                    <td className="px-4 py-2">{run.eligible_users}</td>
                    <td className="px-4 py-2">{run.tests_generated}</td>
                    <td className="px-4 py-2">{run.assignments_created}</td>
                    <td className="px-4 py-2">{run.skipped}</td>
                    <td className={run.failed > 0 ? "px-4 py-2 text-red-600" : "px-4 py-2"}>
                      {run.failed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              Expected cutoff (display only)
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Expected cutoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map((exam) => (
                  <tr key={exam.exam_id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{exam.short_name}</div>
                      <div className="text-xs text-gray-500">{exam.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="e.g. 90+"
                        value={exam.expected_cutoff ?? ""}
                        onChange={(e) => handleCutoffChange(exam, e.target.value)}
                        onBlur={() => handleCutoffBlur(exam)}
                        className="w-24 rounded-md border border-gray-300 px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
