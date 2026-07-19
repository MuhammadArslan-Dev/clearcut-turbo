'use client'
import React, { useEffect } from 'react'
import { useIsMobile } from '@clearcut/hooks/use-is-mobile'
import { CustomBottomSheet, CustomModal } from '../modals-bottom-sheet'
import YearsList from '../blog/ui/years-list'
import { useParams } from 'next/navigation';

export default function YearListModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const isMobile = useIsMobile()
    const params = useParams<{ locale: string, examName: string, level_id: string, year: string }>();
    const examName = params?.examName;
    const levelId = params?.level_id;
    const year = params?.year;
    const locale = params?.locale;

    const [data, setData] = React.useState<any>([]);
    const fetchYears = async () => {
        const query = `where[stage_id][like]=${examName}&limit=0&depth=2&locale=${locale}&draft=false&trash=false`

        const res = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/mapping-instance-and-stage?${query}`, {
            cache: "no-store",
        });
        const data = await res.json();
        setData(data?.docs);
    }
    useEffect(() => {

        fetchYears();
    }, [examName, locale])


    const YearListModalContent = () => {

        return (
            <div>
                <div className='flex flex-col gap-4'>

                    {data?.length > 0 && <YearsList data={data} />}

                </div>
            </div>
        )
    }

    return (
        <div>
            {isMobile ? (
                <CustomBottomSheet
                    isOpen={isOpen}
                    onClose={onClose}
                    isHeader={true}
                    title="Select Year"
                    subtitle=" "
                >
                    <YearListModalContent />
                </CustomBottomSheet>
            ) : (
                <CustomModal
                    isOpen={isOpen}
                    onClose={onClose}
                    isHeader={true}
                    title="Select Year"
                    subtitle=""
                    maxWidth="max-w-[520px]"
                >
                    <YearListModalContent />
                </CustomModal>
            )}
        </div>
    )


}
