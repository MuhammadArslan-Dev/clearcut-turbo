import React from 'react'

type Props = {
    children: React.ReactNode
    
}

export default function SettingsSidebarWrapper({ children }: Props) {
    return (
        // Mobile: the bottom tab bar is fixed over the last ~64px, so keep that
        // strip as padding and let the card scroll — otherwise the Logout row at
        // the bottom is clipped/hidden behind the bar on screens shorter than the list.
        <aside className="w-full md:w-72 flex-shrink-0 bg-white h-full pb-[72px] overflow-y-auto md:pb-0 md:rounded-md md:overflow-hidden flex flex-col justify-between">
            {children}
        </aside>
    )
}
