"use client";

import React, { useEffect } from "react";
import { Chapter, Section } from "../../preparation/types/types";
import CourseContentCard, { PDFCard } from "./cards/CourseContentCard";
import { P_QUERY_KEY } from "../../preparation/hooks/usePreparationData";
import { useQuery } from "@tanstack/react-query";
import { getSectionNotes } from "@/lib/preparation/preparation";
import { ResumeStatePayload } from "@/types/courseresume";
import Text from "@clearcut/ui/text";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import CounterCard from "@/components/ui/cards/CounterCard";
import { handleOpenPaywall } from "../../PayWalls/PaywallFloatingWidget";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useTranslations } from "next-intl";
import { LockIcon } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

export default function SectionNotes({
    sections,
    sectionId,
    examId,
    courseType,
}: {
    sections: Section[];
    sectionId?: number | null;
    examId?: string | number;
    courseType?: string;
}) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations();
    const { course } = useGetCurrentCourseStore();

    const [selectedLang, setSelectedLang] = React.useState<"en" | "hi">("en");
    const [selectedPDF, setSelectedPDF] = React.useState<string | null>(null);

    /* ================= API ================= */
    const { data, isLoading } = useQuery<{
        chapters: Chapter[];
        state: ResumeStatePayload;
    }>({
        queryKey: P_QUERY_KEY(sectionId),
        enabled: !!sectionId,
        queryFn: async () => {
            const res = await getSectionNotes(Number(sectionId), `?course_id=${examId}`);
            return res.data;
        },
        refetchOnWindowFocus: false,
        retry: 1,
    });

    /* ================= SET DEFAULT LANGUAGE ================= */
    useEffect(() => {
        setSelectedLang(course?.language === "english" ? "en" : "hi");
    }, [course]);

    if (isLoading) return <SectionNotesSkeleton />;
    /* ================= HELPERS ================= */

    const getNotesFromData = (dataArray: any[]) =>
        dataArray.flatMap((item) => {
            const notes = item?.content || [];

            if (courseType === "subject") {
                return notes.filter((note: any) => note?.language === selectedLang);
            }

            if (courseType === "language") {
                return notes.length > 0 ? [notes[0]] : [];
            }

            return notes;
        });

    const handlePDFClick = (note: any, locked?: boolean) => {
        if (locked) {
            console.log("locked");
            handleOpenPaywall(router, "topic_card_clicked", course);
            return;
        }

        setSelectedPDF(note?.note_content);
    };

    /* ================= RENDER ================= */

    return (
        <div>
            {data?.chapters.map((chapter, chapterIndex) => (
                <div key={chapter.uuid}>
                    {/* Divider */}
                    <div className="h-0.5 my-4 bg-[var(--border-gray-muted)] w-full" />

                    {/* Chapter Header */}
                    <div className="sticky top-13 z-10 bg-white">
                        <SectionHeaderCard
                            onClick={() =>
                                chapter?.locked &&
                                handleOpenPaywall(router, "topic_card_clicked", course)
                            }
                            trailingIcon={
                                chapter?.locked && (
                                    <CounterCard
                                        width="w-[100px]"
                                        height="h-8"
                                        borderColor="border-[#0083ff] border-2"
                                        value={
                                            <div className="flex items-center gap-2">
                                                <Text variant="body-medium" color="primary-normal">
                                                    Unlock
                                                </Text>
                                                <LockIcon size={20} color="#0083ff" />
                                            </div>
                                        }
                                    />
                                )
                            }
                            breadcrumb={
                                <Text className="text-surface-gray-muted">
                                    {t("common.chapter")} {chapterIndex + 1}
                                </Text>
                            }
                            title={chapter.name}
                            containerClassName="px-4 py-3"
                        />
                    </div>

                    {/* Topics */}
                    <div className="grid md:grid-cols-2 gap-4 p-4">
                        {chapter.topics.map((topic, topicIndex) => {
                            const parentNotes = getNotesFromData(topic?.data || []);

                            const childrenGroups =
                                topic?.children?.map((child) => ({
                                    title: child?.name,
                                    notes: getNotesFromData(child?.data || []),
                                })) || [];

                            const isEmpty =
                                parentNotes.length === 0 &&
                                childrenGroups.every((g) => g.notes.length === 0);

                            const targetTopicId =
                                topic.children?.length
                                    ? topic.children[0].id
                                    : topic.id;

                            return (
                                <div key={topic.uuid} className="col-span-1">
                                    <CourseContentCard
                                        header={{ title: topic.name, showIcon: true }}
                                        counter={{
                                            value: topicIndex + 1,
                                            border: "border-2",
                                            borderColor: "border-brand",
                                        }}
                                        mainButton={{
                                            isShow: true,
                                            text: "Start Learning",
                                            onClick: () =>
                                                router.push(
                                                    `/${locale}/${examId}/preparation?section=${sectionId}&chapter=${chapter.id}&topic=${targetTopicId}`,
                                                ),
                                        }}
                                        notes={
                                            <div className="flex flex-col gap-3">
                                                {/* Parent Notes */}
                                                {parentNotes.map((note, i) => (
                                                    <PDFCard
                                                        key={`parent-${note.id}-${i}`}
                                                        id={String(note.id)}
                                                        title={note.title}
                                                        isLock={chapter?.locked}
                                                        features={{
                                                            type: "Language",
                                                            value: note.language.toUpperCase(),
                                                        }}
                                                        onClick={() =>
                                                            handlePDFClick(note, chapter?.locked)
                                                        }
                                                    />
                                                ))}

                                                {/* Children Groups */}
                                                {childrenGroups.map(
                                                    (group, gIndex) =>
                                                        group.notes.length > 0 && (
                                                            <div key={gIndex} className="space-y-2">
                                                                <SectionHeaderCard
                                                                    title={group.title}
                                                                    containerClassName="px-4 -mx-2 py-3"
                                                                    titleClassName="body-medium font-semibold"
                                                                />

                                                                {group.notes.map((note, i) => (
                                                                    <PDFCard
                                                                        key={`child-${note.id}-${i}`}
                                                                        id={String(note.id)}
                                                                        title={note.title}
                                                                        isLock={chapter?.locked}
                                                                        features={{
                                                                            type: "Language",
                                                                            value: note.language.toUpperCase(),
                                                                        }}
                                                                        onClick={() =>
                                                                            handlePDFClick(note, chapter?.locked)
                                                                        }
                                                                    />
                                                                ))}
                                                            </div>
                                                        )
                                                )}

                                                {/* Empty State */}
                                                {isEmpty && (
                                                    <div className="text-sm text-center text-gray-400">
                                                        Coming Soon !
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* ================= PDF MODAL ================= */}
            {selectedPDF && (
                <div
                    onClick={() => setSelectedPDF(null)}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full sm:w-[90%] h-[85%] sm:h-[90%] rounded-lg overflow-hidden relative"
                    >
                        <button
                            onClick={() => setSelectedPDF(null)}
                            className="absolute top-2 right-2 z-10 bg-white px-3 py-1 rounded shadow cursor-pointer"
                        >
                            ✕
                        </button>

                        <iframe
                            src={selectedPDF}
                            className="w-full h-full"
                            title="PDF Viewer"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function SectionNotesSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2, 3].map((_, chapterIndex) => (
                <div key={chapterIndex} className="space-y-4">
                    {/* Divider */}
                    <div className="h-0.5 my-4 bg-[var(--border-gray-muted)] w-full" />
                    {/* Chapter Header */}
                    <div className="bg-white p-4">
                        <Skeleton className="w-[100px] h-5" />
                    </div>

                    {/* Topics Grid */}
                    <div className="grid md:grid-cols-2 gap-4 px-3">
                        {[1, 2].map((_, topicIndex) => (
                            <div
                                key={topicIndex}
                                className="p-4 bg-white rounded-lg space-y-3"
                            >
                                {/* Title */}
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />

                                {/* PDF rows */}
                                {[1].map((_, pdfIndex) => (
                                    <div
                                        key={pdfIndex}
                                        className="flex items-center justify-between p-2 border border-gray-300 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                                                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}