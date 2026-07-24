import React from 'react'
import { Chapter, ExamSyllabusData, Section } from '../../preparation/types/types';
import CourseContentCard, { PDFCard } from './cards/CourseContentCard';
import { P_QUERY_KEY } from '../../preparation/hooks/usePreparationData';
import { useQuery } from '@tanstack/react-query';
import { getExamSyllabus, getSectionNotes } from '@/lib/preparation/preparation';
import { ResumeStatePayload } from '@/types/courseresume';
import Text from '@clearcut/ui/text';
import SectionHeaderCard from '@/components/ui/cards/preparation/chapter-list/SectionHeaderCard';
import CounterCard from '@/components/ui/cards/CounterCard';
import { handleOpenPaywall } from '../../PayWalls/PaywallFloatingWidget';
import { useGetCurrentCourseStore } from '@/store/course/useGetCurrentCourseStore';
import { useTranslations } from 'next-intl';
import { LockIcon } from '@/components/ui/icons';
import { useRouter } from 'next/navigation';



export default function SectionNotes({
    sections,
    sectionId,
    examId
}: {
    sections: Section[],
    sectionId?: number | null,
    examId?: number
}) {

    const router = useRouter();
    const t = useTranslations();
    const [selectedLang, setSelectedLang] = React.useState<"en" | "hi">("en");
    const [selectedPDF, setSelectedPDF] = React.useState<string | null>(null);
    const { course } = useGetCurrentCourseStore();

    const { data, isLoading, error, refetch } = useQuery<{
        chapters: Chapter[];
        state: ResumeStatePayload;
    }>({
        queryKey: P_QUERY_KEY(sectionId),
        enabled: !!sectionId,

        queryFn: async () => {
            const res = await getSectionNotes(Number(sectionId), `?course_id=${examId}`);
            return res.data;
        },

        // staleTime: 5 * 60 * 1000,
        // gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    if (isLoading) return <div>Loading...</div>;

    console.log("data", data);

    return (
        <div>
            <div className="flex gap-2 mb-4">
                {["en", "hi"].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setSelectedLang(lang as "en" | "hi")}
                        className={`px-4 py-1 rounded-full border ${selectedLang === lang
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-600"
                            }`}
                    >
                        {lang.toUpperCase()}
                    </button>
                ))}
            </div>
            {data?.chapters.map((chapter, index) => (
                <div>
                    <div className="h-0.5 my-4 bg-[var(--border-gray-muted)] w-full"></div>

                    <div className="sticky top-13 z-10 bg-white">
                        <SectionHeaderCard
                            onClick={() =>
                                chapter?.locked
                                    ? handleOpenPaywall(
                                        router,
                                        "topic_card_clicked",
                                        course,
                                    )
                                    : {}
                            }
                            trailingIcon={
                                chapter?.locked && (
                                    <CounterCard
                                        width="w-[100px]"
                                        height="h-8"
                                        borderColor="border-[#0083ff] border-2"
                                        value={
                                            <div className="flex items-center gap-2">
                                                {" "}
                                                <Text
                                                    as="p"
                                                    variant="body-medium"
                                                    weight="normal"
                                                    color="primary-normal"
                                                >
                                                    Unlock
                                                </Text>
                                                <LockIcon size={20} color="#0083ff" />
                                            </div>
                                        }
                                    />
                                )
                            }
                            breadcrumb={
                                <div className="flex items-center gap-1">
                                    <Text
                                        // as="p"
                                        variant="body-medium"
                                        weight="normal"
                                        className="!font-normal text-surface-gray-muted"
                                    >
                                        {t("common.chapter")} {index + 1}
                                    </Text>
                                    {/* <Text
                                        // as="p"
                                        variant="body-small"
                                        weight="normal"
                                        className="!font-normal text-surface-gray-muted"
                                    >
                                        • {chapterProgress.completedTopics} /
                                        {chapterProgress.totalTopics}{" "}
                                        {toLower(t("course.courseStatus.completed"))}
                                    </Text> */}
                                </div>
                            }
                            title={chapter.name}
                            cursor="cursor-pointer"
                            titleClassName="heading-medium !font-semibold text-surface-gray-normal"
                            breadcrumbClassName="body-medium !font-normal text-surface-gray-muted"
                            radiusClassName="rounded-none"

                            containerClassName="px-4 py-3 "
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 p-4">

                        {chapter?.topics.map((topic, index) => {
                            // 🔹 Helper to extract notes
                            const getNotesFromData = (dataArray: any[]) =>
                                dataArray.flatMap((item) =>
                                    (item?.content || []).filter(
                                        (note) => note?.language === selectedLang
                                    )
                                );

                            // 🔹 Parent notes
                            const parentNotes = getNotesFromData(topic?.data || []);

                            // 🔹 Children grouped notes
                            const childrenGroups = topic?.children?.map((child) => ({
                                title: child?.name,
                                notes: getNotesFromData(child?.data || []),
                            }));

                            return (
                                <div key={topic?.uuid || index} className="col-span-1">
                                    <CourseContentCard
                                        header={{
                                            title: topic?.name,
                                            showIcon: true,
                                        }}
                                        counter={{
                                            value: index + 1,
                                            border: "border-2",
                                            borderColor: "border-brand",
                                        }}
                                        notes={
                                            <div className="flex flex-col gap-3">

                                                {/* 🔹 Parent Notes */}
                                                {parentNotes.length > 0 && (
                                                    <div className="space-y-2">
                                                        {parentNotes.map((note, i) => (
                                                            <PDFCard
                                                                key={`parent-${note.id}-${i}`}
                                                                id={String(note.id)}
                                                                title={note.title}
                                                                features={{
                                                                    type: "Language",
                                                                    value: note.language.toUpperCase(),
                                                                }}
                                                                onClick={() => setSelectedPDF(note.note_content)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 🔹 Children Groups */}
                                                {childrenGroups?.map(
                                                    (group, gIndex) =>
                                                        group.notes.length > 0 && (
                                                            <div key={gIndex} className="space-y-2">
                                                                <p className="text-sm font-semibold text-gray-500">
                                                                    {group.title}
                                                                </p>

                                                                {group.notes.map((note, i) => (
                                                                    <PDFCard
                                                                        key={`child-${note.id}-${i}`}
                                                                        id={String(note.id)}
                                                                        title={note.title}
                                                                        features={{
                                                                            type: "Language",
                                                                            value: note.language.toUpperCase(),
                                                                        }}
                                                                        onClick={() =>
                                                                            setSelectedPDF(note.note_content)
                                                                        }
                                                                    />
                                                                ))}
                                                            </div>
                                                        )
                                                )}

                                                {/* 🔹 Empty State */}
                                                {parentNotes.length === 0 &&
                                                    childrenGroups?.every((g) => g.notes.length === 0) && (
                                                        <div className="text-sm text-center text-gray-400">
                                                            No notes available
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

            {selectedPDF && (
                <div onClick={() => setSelectedPDF(null)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white w-full sm:w-[90%] h-[85%] sm:h-[90%]  rounded-lg overflow-hidden relative">

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedPDF(null)}
                            className="absolute top-2 right-2 z-10 bg-white px-3 py-1 rounded shadow"
                        >
                            ✕
                        </button>

                        {/* PDF Viewer */}
                        <iframe
                            src={selectedPDF}
                            className="w-full h-full"
                            title="PDF Viewer"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
