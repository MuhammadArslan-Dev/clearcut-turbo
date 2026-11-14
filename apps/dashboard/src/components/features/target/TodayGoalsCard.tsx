"use client";

import { useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { trackMeterActionClicked, type MeterCtx } from "@/lib/analytics/cutoffMeter";
import type {
  CutoffMeterActionType,
  CutoffMeterDetail,
  FullLengthGoal,
  NextTopicGoal,
  SectionalGoal,
} from "@/lib/dashboard/cutoffMeter";

type TrackCtx = Omit<MeterCtx, "surface" | "userId">;
type Goal = NextTopicGoal | SectionalGoal | FullLengthGoal;

const CARD = "rounded-[20px] border border-[var(--color-border-gray-subtle)] bg-white p-4";

/** Same analytics vocabulary as the old plan rows (Cutoff Meter Action Clicked). */
const ACTION_TYPE: Record<Goal["key"], CutoffMeterActionType> = {
  next_topic: "LEARN",
  sectional_test: "SECTIONAL_TEST",
  full_length_test: "FULL_LENGTH_TEST",
};

/**
 * Where a goal leads. Every id comes from the backend goal (TodayGoalsService): course (group_code in the
 * route), paper (stage), section, chapter, topic / test — nothing is guessed on the client.
 *  - Next topic      → the exact topic in Learn (section → chapter → topic).
 *  - Sectional / full → the test list of that paper, which opens that test's start sheet (?startTest=).
 *  - A locked goal    → the unlock (payment) page, never the content: the server refuses it anyway.
 */
export function goalHref(g: Goal, courseId: string, examName?: string | null): string {
  if (g.locked) {
    const q = new URLSearchParams({ exam_id: courseId, source: "my_courses_card_clicked" });
    if (examName) q.set("course_name", examName);
    return `/payment/initiated?${q.toString()}`;
  }
  if (g.key === "next_topic") {
    const q = new URLSearchParams();
    if (g.section_id) q.set("section", String(g.section_id));
    if (g.chapter_id) q.set("chapter", String(g.chapter_id));
    if (g.topic_id) q.set("topic", String(g.topic_id));
    return `/preparation/${courseId}?${q.toString()}`;
  }
  const q = new URLSearchParams({
    testType: g.key === "sectional_test" ? "sectional-tests" : "full-length-papers",
  });
  if (g.paper_id) q.set("paper", String(g.paper_id));
  if (g.key === "sectional_test" && g.section_id) q.set("section", String(g.section_id));
  if (g.test_id) q.set("startTest", String(g.test_id));
  return `/test-series/${courseId}?${q.toString()}`;
}

/**
 * Target tab "Today's goals" (phase 111): Next topic, Sectional test, Full-length test. Titles, progress and
 * the done-today tick are the student's real data (backend `goals`); a locked goal says so and leads to the
 * unlock page.
 */
export default function TodayGoalsCard({
  m,
  courseId,
  track,
}: {
  m: CutoffMeterDetail;
  courseId: string;
  track: TrackCtx;
}) {
  const t = useTranslations("target");
  const router = useRouter();
  const { user } = useAuth() as { user?: { uuid?: string } | null };
  const [going, setGoing] = useState<string | null>(null);
  const goals = m.goals;

  if (!goals) {
    return (
      <section className={CARD}>
        <h2 className="heading-medium !font-bold text-surface-gray-normal">{t("goals.title")}</h2>
        <p className="mt-1 body-medium !font-medium text-surface-gray-muted">{t("goals.unavailable")}</p>
      </section>
    );
  }

  const list: Goal[] = [goals.next_topic, goals.sectional_test, goals.full_length_test];
  const doneToday = list.filter((g) => g.completed_today).length;

  const title = (g: Goal): string =>
    g.key === "next_topic" ? t("goals.nextTopic") : g.key === "sectional_test" ? t("goals.sectional") : t("goals.fullLength");

  const detail = (g: Goal): string => {
    if (g.status === "none") {
      return g.key === "next_topic" ? t("goals.allTopicsDone") : t("goals.allTestsDone");
    }
    if (g.key === "next_topic") return [g.topic, g.chapter].filter(Boolean).join(" · ");
    if (g.key === "sectional_test") {
      return t("goals.sectionalMeta", { section: g.section ?? "", number: g.test_number ?? 0, questions: g.questions ?? 0 });
    }
    return t("goals.fullMeta", { number: g.test_number ?? 0 });
  };

  const progress = (g: Goal): string =>
    g.key === "next_topic"
      ? t("goals.topicsProgress", { done: g.progress.done, total: g.progress.total })
      : t("goals.testsProgress", { done: g.progress.done, total: g.progress.total });

  const go = (g: Goal, index: number) => {
    if (going || g.status === "none") return; // double tap / nothing to open
    setGoing(g.key);
    trackMeterActionClicked(
      m,
      { surface: "target_page", ...track, userId: user?.uuid ?? null },
      {
        id: `goal:${g.key}`,
        rank: index + 1,
        action_type: ACTION_TYPE[g.key],
        section_id: g.section_id ?? null,
        topic_id: g.key === "next_topic" ? (g.topic_id ?? null) : null,
        test_id: g.key === "next_topic" ? null : (g.test_id ?? null),
        locked: g.locked,
        title: title(g),
        reason_key: "todays_goal",
        params: {},
        clicked: false,
        completed: g.completed_today,
      },
      index + 1,
    );
    router.push(goalHref(g, courseId, track.examName));
  };

  return (
    <section className={CARD}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="heading-medium !font-bold text-surface-gray-normal">{t("goals.title")}</h2>
          <p className="body-small !font-medium text-surface-gray-muted">{t("goals.sub")}</p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-0.5 body-small !font-bold tabular-nums bg-[var(--color-primary-bg-soft)] text-[var(--color-brand-dark)]">
          {doneToday}/{list.length}
        </span>
      </div>

      <ul className="mt-1 divide-y divide-[var(--color-border-gray-subtle)]">
        {list.map((g, i) => {
          const none = g.status === "none";
          return (
            <li key={g.key}>
              <button
                type="button"
                onClick={() => go(g, i)}
                disabled={!!going || none}
                aria-label={`${title(g)}: ${detail(g)}`}
                className={clsx(
                  "flex w-full items-center gap-3 py-3 text-left",
                  none ? "cursor-default" : "cursor-pointer disabled:cursor-default",
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2 text-white body-small !font-bold",
                    g.completed_today
                      ? "border-[var(--color-success)] bg-[var(--color-success)]"
                      : "border-[var(--color-border-gray-subtle)]",
                  )}
                >
                  {g.completed_today ? "✓" : ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate heading-small !font-bold leading-6 text-surface-gray-normal">{title(g)}</span>
                  <span className="block truncate body-small !font-medium text-surface-gray-muted">{detail(g)}</span>
                  <span className="block body-small !font-medium text-surface-gray-muted tabular-nums">{progress(g)}</span>
                </span>
                {g.locked ? (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-full px-2 body-small !font-bold bg-[var(--color-primary-bg-soft)] text-[var(--color-brand-dark)]">
                    {t("goals.unlock")}
                  </span>
                ) : g.completed_today ? (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-full px-2 body-small !font-bold bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)]">
                    {t("goals.doneToday")}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
