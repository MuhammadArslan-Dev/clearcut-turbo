'use client';
import React from 'react'
import { useContentDataStore } from '../store/useContentDataStore';
import { mapPapersToItems, mapSectionsToItems } from '@/lib/mapPapersToItems';
import PaperTabs from '@/components/ui/tabs/PaperTabs';
import useLanguageSwitch from '@/hooks/useLanguageSwitch';
import SectionSwitchUI from '@/components/ui/tabs/SectionSwitchUI';
import SectionNotes from '../components/section-notes';
import { useGetCurrentCourse } from '@/hooks/course/useGetCurrentCourse';
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
