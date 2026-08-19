'use client';
import React from 'react'
import { useContentDataStore } from '../store/useContentDataStore';
import { mapPapersToItems, mapSectionsToItems } from '@/lib/mapPapersToItems';
import PaperTabs from '@/components/ui/tabs/PaperTabs';
import useLanguageSwitch from '@/hooks/useLanguageSwitch';
import SectionSwitchUI from '@/components/ui/tabs/SectionSwitchUI';
import SectionNotes from '../components/section-notes';
import { useGetCurrentCourse } from '@/hooks/course/useGetCurrentCourse';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotesPage({ examId }: { examId?: string }) {

    useGetCurrentCourse({ courseId: examId });

    const {
        selectedPaperId,
        sectionsMap,
        papers,
        selectPaper,
        selectedSections,
        toggleSection,
        setData,
        isLoading,
    } = useContentDataStore();


    const { locale } = useLanguageSwitch();

    const sections = (selectedPaperId != null ? sectionsMap[selectedPaperId] : undefined) ?? [];

    const activeSection = sections.find((section) => section.id === selectedSections);

    const items = React.useMemo(
        () => {
            return mapPapersToItems(papers, locale);
        },
        [papers, locale],
    );

    const sectionItems = mapSectionsToItems(sections, locale);

    // Papers/sections come from ContentShell's syllabus fetch — until it
    // resolves, this tab bar has nothing to show and previously rendered as
    // empty space that then popped the real tabs in, so a tap during that
    // window landed on whatever was underneath instead of a tab.
    if (isLoading) {
        return <NotesPageSkeleton />;
    }

    return (
        <div>
            <div className='bg-white sm:bg-transparent -mt-1 py-1'>
                {items?.length > 1 && (
                    <div className='px-4'>
                        <PaperTabs
                            tabs={items}
                            selectedId={selectedPaperId?.toString() ?? null}
                            onChange={(id) => selectPaper(Number(id))}
                            containerBg="bg-transparent"
                        />
                    </div>
                )}


                <div className='w-full flex justify-center'>
                    <SectionSwitchUI
                        layoutId={"section-tab-preparation"}
                        items={sectionItems}
                        active={selectedSections?.toString() ?? null}
                        changeSection={(id: string) => toggleSection(Number(id))}
                    />
                </div>
            </div>

            <SectionNotes sections={sections} sectionId={selectedSections} examId={examId} courseType={activeSection?.type} />

        </div>

    )
}

function NotesPageSkeleton() {
    return (
        <div>
            {/* Subject tabs */}
            <div className="flex gap-2 px-4 py-3 overflow-hidden">
                {["w-24", "w-20", "w-24", "w-16", "w-32"].map((w, i) => (
                    <Skeleton key={i} className={`h-10 shrink-0 ${w}`} rounded="rounded-t-lg" />
                ))}
            </div>

            {/* Section switch */}
            <div className="w-full flex justify-center py-2">
                <Skeleton className="h-9 w-[220px]" rounded="rounded-full" />
            </div>

            {/* Chapter header */}
            <div className="px-4 py-3 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-52" />
            </div>

            {/* Note cards */}
            <div className="grid md:grid-cols-2 gap-4 p-4">
                {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className="p-4 bg-white rounded-lg space-y-3 border border-[var(--border-gray-muted)]">
                        <Skeleton className="h-4 w-40" />
                        <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-10 h-10" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-20" rounded="rounded-full" />
                        </div>
                        <Skeleton className="h-9 w-full" rounded="rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
