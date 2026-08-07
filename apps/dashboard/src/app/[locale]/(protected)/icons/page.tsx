import {
    AnalyticsLeaderIcon,
    CalendarIcon,
    ChartSuccessBarIcon,
    CheckIcon,
    ClockIcon,
    ClipBoardIcon,
    EmailIcon,
    EnLangCircleIcon,
    FacebookIcon,
    HindiLangCircleIcon,
    HomeIcon,
    HomeIcon2,
    InstagramIcon,
    LanguageIcon,
    LinkedInIcon,
    MainAppLogo,
    PaymentCardIcon,
    PhoneIcon,
    SettingGearIcon,
    TelegramIcon,
    WarningCircleIcon,
    WhatsappIcon,
    YoutubeIcon,
    FireIcon,
    CircleTickIcon,
    GraduationCapIcon,
    ProfileIcon,
    TrophyIcon,
    LogoutDoorIcon,
    LearningInsightIllustration,
    StarBadge,
    LockIcon,
    ChevronIcon,
    CircleIcon,
    ArrowIcon,
    SheildIcon,
} from '@/components/ui/icons'
import PieChartIcon from '@/components/ui/icons/pie-chart-icon'
import SandTimerIcon from '@/components/ui/icons/sand-timer-icon'
import TickIcon from '@/components/ui/icons/tick-icon'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

export default function page() {
    return (
        <div className='flex flex-wrap gap-4 p-12'>
            <AnalyticsLeaderIcon />
            <CalendarIcon />
            <ChartSuccessBarIcon />
            <CheckIcon />
            <ClockIcon />
            <ClipBoardIcon />
            <EmailIcon />
            <EnLangCircleIcon />
            <FacebookIcon />
            <HindiLangCircleIcon />
            <HomeIcon />
            <HomeIcon2 />
            <InstagramIcon />
            <LanguageIcon />
            <LinkedInIcon />
            <MainAppLogo />
            <PaymentCardIcon />
            <PhoneIcon />
            <SettingGearIcon />
            <TelegramIcon />
            <WarningCircleIcon />
            <WhatsappIcon />
            <YoutubeIcon />
            <FireIcon />
            <FireIcon variant='red' />
            <CircleTickIcon />
            <GraduationCapIcon />
            <GraduationCapIcon variant='outline' />
            <ProfileIcon />
            <ProfileIcon variant='outline' />
            <TrophyIcon />
            <LogoutDoorIcon />
            <StarBadge />
            <LockIcon />
            <ChevronIcon />
            <TickIcon />
            <CircleIcon />
            <ArrowIcon />
            <SheildIcon />
            <SandTimerIcon />
            <PieChartIcon />
            <LearningInsightIllustration />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton rounded={'rounded-full'} className="h-12 w-12" />
        </div>
    )
}
