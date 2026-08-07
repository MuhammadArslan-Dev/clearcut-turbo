import React from 'react'

type Props = {
    children: React.ReactNode
    
}

export default function SettingsSidebarWrapper({ children }: Props) {
    return (
        <aside className="w-full md:w-72 flex-shrink-0 bg-white h-[calc(100%-55px)] md:h-full md:rounded-md overflow-hidden flex flex-col justify-between">
            {children}
        </aside>
    )
}
