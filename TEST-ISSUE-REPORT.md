# Exam Attempt Flow — Security & Performance Audit

Saved so this doesn't need to be re-audited from scratch next time. Read-only audit, no code changes made yet.

- **Date:** 2026-08-22
- **Scope:** Exam attempt flow — start exam, answer/autosave, timer, end exam, report. `apps/dashboard` (Next.js) + `clearcutoff-main-backend` (Laravel).
- **Method:** 4 parallel code reads — frontend performance, frontend security, backend performance, backend security.
- **Live artifact (nicer to read):** https://claude.ai/code/artifact/48f8937b-24f5-4c75-94b8-a3aa8c170956
- **Totals:** 10 security findings (2 Critical, 1 High, 3 Medium, 4 Low), 20 performance findings (7 High, 10 Medium, 3 Low).

## Suggested fix order

1. Scope `getExam` to the caller and strip answer/explanation fields pre-submission.
2. Scope chapter-test creation to the caller's enrollment, matching the sectional branch.
3. Enforce `status` and elapsed time server-side in submitAnswer/clearAnswer/markForReview.
4. Remove the hardcoded `result` overwrite in `submitAnswer`.
5. Convert `endExam` to POST and add row locking to its idempotency check.
6. Bulk-insert exam questions on create; replace `inRandomOrder()`.
7. Fix the unusable index on `exam_attempt_questions.unit_id`.
8. Add Zustand selectors across the exam-taking screen; memoize `QOption`; isolate the per-question timer.
9. Replace the report screen's hardcoded 3s delay with the real query loading state.

## Security findings

### Critical

**1. Any user can read every correct answer before answering — and read other users' exams**
`ExamController.php:328-342` (`getExam`) — unlike every sibling method (`endExam`, `submitAnswer`, `clearAnswer`, `markForReview`, all of which scope to `Auth::id()`), this one does a bare `where('uuid', $examId)->firstOrFail()` with no ownership check. `ExamResourceNew.php:118-159` unconditionally serializes `correct_option`/`explanation` for every question regardless of attempt status. Frontend (`useGetExam.ts` → `setExam(res.data)`, types in `types/exam.ts:19-20,56`) stores this verbatim with no redaction step. Exploit: start an exam, read the `get-exam` network response, see the full answer key before answering. Exam UUIDs are also partially structured (`EXAM-{date}-{userId}-{paperId}-{random6}`), so a second user's attempt may be fetchable the same way.
**Fix:** add `where('user_id', Auth::id())` to `getExam`; strip `correct_option`/`explanation` from the resource while `status !== 'submitted'`.

**2. Chapter-test creation skips the paywall/enrollment check every other test type has**
`ExamController.php:158-162` — the `chapter` branch does `SChapter::query()->find($request->chapterId)` with zero ownership/enrollment check, unlike the `sectional` branch which correctly scopes via `$course->stage->data->where(...)`. Exploit: a trial/unpaid user enumerates `chapterId` and calls `create-exam` directly for paid content.
**Fix:** scope the chapter lookup to the caller's enrolled course/stage.

### High

**3. Nothing stops answering after an exam has expired or already been submitted**
`ExamController.php:398-582` (submitAnswer/clearAnswer/markForReview) — none check `status === 'in_progress'`. Time expiry is only enforced by `heartbeat`, a client-initiated call; there's no independent server-side wall-clock cutoff in these three endpoints. Exploit: never call heartbeat, keep answering (or editing answers) past the real time limit or after submission.
**Fix:** check `status` + elapsed time server-side in all three mutation endpoints.

### Medium

- `ExamController.php:262-267` — `endExam` is a **GET** with a side effect, no CSRF-compensating control, and a check-then-act idempotency guard with no `lockForUpdate()` (unlike `heartbeat`, which does lock) — two concurrent calls can both pass the "already submitted" check.
- `useSingleTab.ts` — tab-switch/proctoring guard is `localStorage` + a `storage` event only; trivially bypassed (incognito window, second browser) and never reports anything to the server.
- `useExamTimer.ts:48-64` — remaining time is client-decremented, reconciled against the server only every 60s (and only past 3s drift) — a narrow window for a stalled tab to push one extra submission past the true deadline.

### Low

- `ExamController.php:461` — `$data['user_option'] === $correctOption` compares a validated string against a DB value of unconfirmed type; if the column is an int, every answer could silently grade wrong.
- `ExamController.php:343-346` — `examReport()` is `return Exam::all();`, no auth scope or filter, dumps every exam row to any caller. Looks like an unfinished stub.
- Only a shared 60 req/min throttle covers the whole API — no dedicated tighter limit on submitAnswer/clearAnswer/markForReview/heartbeat.
- `ExamReportSheet.tsx:709-711` — explanation renders via `ReactMarkdown` with raw HTML disabled by default (safe today); flagged so it isn't casually enabled later for admin-authored content.

## Performance findings

### High

1. **`ExamController.php:133-223` (createExam, all 3 branches)** — per-question `ExamAttemptQuestion::create()` in a loop (150-200 sequential inserts for a full-length exam) plus `inRandomOrder()` (`ORDER BY RAND()`) per section (6-8x per request) — unindexable full scan+sort on the user-facing "start exam" click.
2. **`ExamAttemptSection.php:40` + migration `2026_02_05_053741:53`** — `sections.questions` (eager-loaded by both `getExam` and `endExam`, the two hottest reads) queries `WHERE unit_id IN (...)` with no `unit_type` predicate; the only index is composite `(unit_type, unit_id)` and can't be used with the leading column unfiltered. Unindexed scan on a table that grows with every question of every attempt.
3. **`mainContent.tsx:112,169-176` + `QOption.tsx`** — a local 1s stopwatch interval plus an unused `useExamTimer.remaining` both re-render the full question/option subtree (ReactMarkdown re-parses included) up to twice a second; `QOption` isn't memoized.
4. **`QuestionNavigationPanel.tsx:65`, `QuestionViewPanel.tsx:20`, `Topbar.tsx:87`, `ExamEndConfirmationSheet.tsx:36`** — zero Zustand selectors anywhere; every one of these re-renders on every answer click, mark-for-review, or language toggle.
5. **`ExamReportSheet.tsx:180-186`** — hardcoded `setTimeout(..., 3000)` gates the report screen regardless of the real query loading state, right after a timed exam finishes.

### Medium (10) / Low (3) — see the artifact or ask me to re-paste; full list also lives in the linked artifact.

## Notes / non-findings (checked, OK)

- No client-trusted score/is_correct — server computes `result` authoritatively (aside from the submitAnswer clobber bug above).
- Auth (`Authorization: Bearer`) attached consistently across all exam-mutating calls via `apiFetch`.
- No mass-assignment vector found (`$fillable` explicit, no `Model::create($request->all())`).
- `useExamStore`'s `persist` config correctly `partialize`s to avoid persisting the full exam object.
