'use client'
import React, { useEffect } from 'react'
import { useLanguageStore } from '@/store/useLanguageStore';
import { getQuestionsByLanguage } from '@/utils/getQuestionsByLanguage';
interface DetailsSectionCardProps {
    yearId?: string;
    Labels?: { lable: string; value: string }[];
    totalQuestions?: any[];
    sourceLabel?: string;
    sources?: { lable: string; value: string }[];
    solveTime?: string;
}

export default function DetailsSectionCard({ yearId, Labels, totalQuestions, sourceLabel, sources, solveTime }: DetailsSectionCardProps) {
    const { courseLanguage } = useLanguageStore();
    const [totalQuestionsCount, setTotalQuestionsCount] = React.useState<number>(0);

    useEffect(() => {
        if (!totalQuestions || totalQuestions.length === 0) return;

        const filteredQuestions = getQuestionsByLanguage(totalQuestions, courseLanguage);

        setTotalQuestionsCount(filteredQuestions.length);
    }, [totalQuestions, courseLanguage]);

    return (
        <div>
            <div className='flex justify-between item-center '>
                <div className='heading-small !font-semibold surface-text-gray-normal'>Question Details</div>
                {solveTime && (
                    <div>
                        <span className='body-medium !font-normal surface-text-gray-muted'>Time to Solve:</span>{' '}
                        <span className='body-medium !font-semibold text-brand px-2 bg-[#006bd1]/10 rounded-md'>{solveTime}</span>
                    </div>
                )}
            </div>
            <div className='mt-1 grid grid-cols-2 gap-x-8 gap-y-1 text-sm'>
                <div className='col-span-1 space-y-1'>
                    {Labels?.map((item, index) => {
                        return (
                            <div key={index}>
                                <span className='body-medium !font-normal surface-text-gray-muted'>{item.lable}:</span>{' '}
                                <span className='body-medium !font-normal surface-text-gray-normal'>{item.value}</span>
                            </div>
                        )
                    })}

                </div>
                <div className='col-span-1 flex flex-col items-start gap-2 '>
                    {sources?.map((item, index) => {
                        return (
                            <div key={index}>
                                <span className='body-medium !font-normal surface-text-gray-muted'>{item?.lable}:</span>{' '}
                                <span className='body-medium !font-normal surface-text-gray-normal'>{item?.value}</span>
                            </div>
                        )
                    })}
                    {yearId && (
                        <div>
                            <span className='body-medium !font-normal surface-text-gray-muted'>{sourceLabel ?? "Year"}:</span>{' '}
                            <span className="text-gray-600">
                                {yearId}

                            </span>
                        </div>
                    )}
                    {totalQuestionsCount > 0 && (
                        <div>
                            <span className='body-medium !font-normal surface-text-gray-muted'>Questions:</span>{' '}
                            <span className='body-medium !font-semibold text-brand px-2 bg-[#006bd1]/10 rounded-md'>{totalQuestionsCount}</span>
                        </div>
                    )}



                </div>

            </div>
        </div>
    )
}
