'use client'
import React, { useEffect } from 'react'
import QuestionCard from '../ui/question-card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { usePathname } from 'next/navigation';
import { limitWords } from '@clearcut/utils/text-limit';
import { formatToSlug } from '@/utils/slugify';

interface AssessmentQuestion {
    correct_option: number;
    slug: string;
    createdAt: string;
    exam_instance_id: string;
    explanation: string;
    id: number;
    language_code: string;
    label_id: string;
    option_1_image_url: string;
    option_1_text: string;
    option_2_image_url: string;
    option_2_text: string;
    option_3_image_url: string;
    option_3_text: string;
    option_4_image_url: string;
    option_4_text: string;
    question_id: string;
    question_image_url: string;
    question_number: string;
    question_text: string;
    section_id: string;
    stage_id: string;
    updatedAt: string;
}


export default function QuestionsListByChapter({ data }: { data: AssessmentQuestion[] }) {

    const [loadingId, setLoadingId] = React.useState<number | null>(null);
    const [visibleCount, setVisibleCount] = React.useState<number>(10);
    const [allData, setAllData] = React.useState<AssessmentQuestion[]>([]);

    const { courseLanguage } = useLanguageStore();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const courseLangName =
            courseLanguage.toLowerCase() === 'en' ? 'english' : 'hindi';

        const combinedData = data
            // Filter phase
            .filter(item => {
                const lang = item.language_code.toLowerCase();
                // Keep selected course language or anything that's not English/Hindi
                return lang === courseLangName || (lang !== 'english' && lang !== 'hindi');
            })
            // Sort phase
            .sort((a, b) => {
                const aLang = a.language_code.toLowerCase();
                const bLang = b.language_code.toLowerCase();
                const aIsCourseLang = aLang === courseLangName;
                const bIsCourseLang = bLang === courseLangName;

                // Put selected language first
                if (aIsCourseLang && !bIsCourseLang) return -1;
                if (!aIsCourseLang && bIsCourseLang) return 1;

                // Then sort alphabetically
                return aLang.localeCompare(bLang);
            });

        setAllData(combinedData);
    }, [data, courseLanguage]);


    const shown = Array.isArray(allData) ? allData.slice(0, Math.min(visibleCount, allData.length)) : [];
    const [isOpen, setIsOpen] = React.useState(false);

    const basePath = usePathname();

    return (
        <div className="grid grid-cols-1 gap-4">
            {data?.map((item: any, index: number) => {
                return (
                    <>
                        {data?.map((item, index) => {
                            const plain = item.question_text?.replace(/<[^>]*>/g, "") || "";
                            const snippet = limitWords(plain, 25);
                            const slug= item?.slug ? item.slug : formatToSlug(limitWords(item.question_text, 4));
                            
                            return (
                                <>
                                    <QuestionCard
                                        key={index}
                                        q_no={item.question_number}
                                        index={index}
                                        setLoadingId={setLoadingId}
                                        path={`/question/${slug}-${item.id}`}
                                        onClick={() => setLoadingId(item.id)}
                                        questionText={snippet}
                                        active={loadingId === item.id}
                                    />
                                </>
                            )
                        }
                        )}
                    </>
                )
            })}
        </div>
    )
}
