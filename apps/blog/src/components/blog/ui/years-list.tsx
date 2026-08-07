import RightArrowBox from '@/components/ui/arrows/right-arrow-box';
import NumberedShape from '@/components/ui/numbered-shape';
import { formatToSlug, unFormatSlug } from '@/utils/slugify';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import React from 'react'

interface Props {
    data?: [],
}

export default function YearsList({ data }: Props) {

    const [loading, setLoading] = React.useState<boolean>(false);
    const params = useParams<{ locale: string, examName: string, level_id: string }>();
    const pathname = usePathname();
    const instanceIds = JSON.parse(data?.[0].instance_id.replace(/'/g, '"'));

    return (
        <div className={[loading ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}>
            {instanceIds.map((item, index) => (
                <Link prefetch={true} href={`/${params?.locale}/${params?.examName}/${params?.level_id}/${formatToSlug(unFormatSlug(item))}`} onClick={() => setLoading(true)} key={index}>
                    <div className='flex items-center justify-between p-4 md:p-5 border-b border-gray-300'>
                        <div className='flex items-center gap-4'>
                            <NumberedShape number={index + 1} />
                            <div>
                                <div className='font-semibold text-gray-900'>Previous Year Paper {unFormatSlug(item)}</div>
                                <div className='text-sm text-gray-500'>150 questions & detailed answers</div>
                            </div>
                        </div>
                        <RightArrowBox size={30} onClick={() => setLoading(true)} />

                    </div>
                </Link>
            ))}
        </div>
    )
}
