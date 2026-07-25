import { useIsMobile } from '@clearcut/hooks/use-is-mobile'
import React from 'react'
import { CustomBottomSheet, CustomModal } from '../modals-bottom-sheet'
import { Card } from "@clearcut/ui/card";
import { Button } from '@mui/joy'
import { highlightTextUtil } from '@clearcut/utils/highlight-text'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useTransition } from "react";
import { useParams } from "next/navigation";
import { Locale, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@clearcut/i18n/routing";
import { AppLocale } from "@/types/components/language";

export default function LanguageModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {

    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const params = useParams();
    const locale = useLocale() as AppLocale; // current locale
    const { setAppLanguage, courseLanguage, setCourseLanguage } = useLanguageStore();

    const locales = routing.locales;
    const currentIndex = locales.indexOf(locale);
    const nextLocale = locales[(currentIndex + 1) % locales.length]; // cycle

    function switchLanguage(nextLocale: AppLocale) {
        startTransition(() => {
            router.replace(
                // @ts-expect-error - TS validates params per pathname
                { pathname, params },
                { locale: nextLocale }
            );
        });
    }

    const isMobile = useIsMobile()


    const LanguageModalContent = () => {
        const languages = [
            { code: 'en', name: 'English', flag: '🇬🇧', translate: 'English' },
            { code: 'hi', name: 'Hindi', flag: '🇮🇳', translate: 'हिंदी' },
        ];

        return (
            <div className="p-6">

                {/* Language List */}
                <div className=" space-y-8">
                    <div className='flex flex-col gap-4'>
                        <div className='space-y-1'>
                            <h2 className='heading-large font-semibold neutral-blueGrayLight'>Select App Language</h2>
                            <p className='body-medium font-normal surface-text-gray-muted'>Language for buttons, menus, and app navigation</p>
                        </div>
                        <div className="flex gap-4">
                            {languages.map((item, index) => (
                                <Card
                                    key={index}
                                    onClick={() => {
                                        setAppLanguage(item.code)
                                        switchLanguage(item.code)
                                    }}
                                    cursor="pointer"
                                    borderwidth={2}
                                    bordercolor={locale === item.code ? '#0083ff' : '#CBD5E2'}
                                    bgcolor={locale === item.code ? '#0084ff17' : '#ffffff'}
                                >
                                    <div className="space-y-1">
                                        <h3 className="body-large font-medium">{item.name}</h3>
                                        <p className="body-medium font-normal text-oncloud-onintense">
                                            {item.translate}
                                        </p>
                                    </div>
                                </Card>
                            ))}

                        </div>
                    </div>

                    {params.examName  && (
                        <div className='flex flex-col gap-4'>
                            <div className='space-y-1'>
                                <h2 className='heading-large font-semibold neutral-blueGrayLight'>{highlightTextUtil(`Select ${params.examName.toUpperCase()} Exam Language`, params.examName.toUpperCase())}</h2>
                                <p className='body-medium font-normal surface-text-gray-muted'>Language for lessons, notes, and tests for HTET Exam</p>
                            </div>
                            <div className="flex gap-4">
                                {languages.map((item, index) => (
                                    <Card
                                        onClick={() => {
                                            setCourseLanguage(item.code)
                                        }}
                                        key={index}
                                        cursor="pointer"
                                        borderwidth={2}
                                        bordercolor={courseLanguage === item.code ? '#0083ff' : '#CBD5E2'}
                                        bgcolor={courseLanguage === item.code ? '#0084ff17' : '#ffffff'}
                                    >
                                        <div className="space-y-1">
                                            <h3 className="body-large font-medium">{item.name}</h3>
                                            <p className="body-medium font-normal text-oncloud-onintense">
                                                {item.translate}
                                            </p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                </div>


            </div>
        );
    }

    return (
        <div>
            {isMobile ? (
                <CustomBottomSheet
                    isOpen={isOpen}
                    onClose={onClose}
                    isHeader={true}
                    title="Select Language"
                    subtitle=" "
                >
                    <LanguageModalContent />
                </CustomBottomSheet>
            ) : (
                <CustomModal
                    isOpen={isOpen}
                    onClose={onClose}
                    isHeader={true}
                    title="Select Language"
                    subtitle=""
                    maxWidth="max-w-[420px]"
                >
                    <LanguageModalContent />
                </CustomModal>
            )}
        </div>
    )



}


const footerContent = () => {
    return (
        <div className="flex justify-end gap-4">
            <Button variant="outlined" >Cancel</Button>
            <Button >Save</Button>
        </div>
    )
}


