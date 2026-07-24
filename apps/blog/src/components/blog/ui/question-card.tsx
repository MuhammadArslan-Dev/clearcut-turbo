import React from 'react'
import Link from 'next/link'
import CardWrap from '@/components/cards/card-wrap'
import StarBadge from '@/components/ui/badge/star-badge';
import { Button } from '@mui/joy';
import { formatToSlug, unFormatSlug } from '@/utils/slugify';
import { limitWords } from '@clearcut/utils/text-limit'
import CalendarIcon from '@clearcut/ui/icons/calendar-icon';
import { useParams } from 'next/navigation';

interface Props {
    q_no?: string | number;
    index?: number;
    setLoadingId?: (id: number) => void;
    path?: string;
    onClick?: () => void;
    questionText?: string;
    active?: boolean;
    chapter_name?: string;
    topic_name?: string;
    correct_option?: string;
    source?: string;
}

export default function QuestionCard({ q_no, index, setLoadingId, path, onClick, questionText, active = false, chapter_name, topic_name, source }: Props) {
    return (
        <Link key={index} href={`${path}`} onClick={onClick}>
            <CardWrap cursor="pointer" padding={"12px 16px"}>
                <div className={`flex flex-col gap-4 ${active ? "opacity-80" : ""}`}>
                    <div className='grid grid-cols-2 items-center gap-2'>
                        <div className='flex items-center gap-4 col-span-1'>
                            <div className="body-medium font-semibold text-[#768EA7] ">
                                Question {q_no}
                            </div>
                            <div className='flex items-center gap-1 text-[#00a251]'>
                                <StarBadge size={20} color="#00a251" />
                                Easy
                            </div>
                        </div>

                        <div className='col-span-1 justify-self-end'>
                            <div className='flex items-center gap-2'>
                                <p className="body-medium text-[#768EA7] flex items-center gap-1">
                                    <CalendarIcon size={16} color="#768EA7" />
                                    Source :
                                </p>
                                <div className="body-medium text-black">
                                    {source}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="flex-1 body-medium text-gray-700">
                            {questionText}
                        </div>
                    </div>

                    {(chapter_name || topic_name) && (
                        <div>
                            {chapter_name && (
                                <div className='flex gap-2'>
                                    <div className="body-medium text-[#768EA7] flex items-center gap-1">
                                        Chapter :
                                    </div>
                                    <div className="body-medium text-black">
                                        {chapter_name}
                                    </div>
                                </div>
                            )}
                            {topic_name && (
                                <div className='flex gap-2'>
                                    <div className="body-medium text-[#768EA7] flex items-center gap-1">
                                        Topic :
                                    </div>
                                    <div className="body-medium text-black">
                                        {topic_name}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="w-full md:w-auto flex justify-end gap-2">
                        <Button variant="outlined" className="shrink-0">
                            {active ? <div className="text-brand font-semibold flex items-center gap-2 shrink-0">
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                                Loading…
                            </div> : "View Options & Answer →"}
                        </Button>
                    </div>
                </div>
            </CardWrap>
        </Link>
    )
}
