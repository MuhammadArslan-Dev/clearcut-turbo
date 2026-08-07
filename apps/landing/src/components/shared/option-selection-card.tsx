'use client'
import React from 'react'
import { Card } from '@clearcut/ui/card';
import { CheckIconGreen } from './ComparisonTable';

interface OptionSelectionCardProps {
    content: React.ReactNode;
    selected?: boolean;
    showIcon?: boolean;
    onClick?: () => void;
    padding?: string;
    borderColor?: {
        selected: string;
        unselected: string;
    };
    bgColor?: {
        selected: string;
        unselected: string;
    };
    borderRadius?: number;
    cursor?: string;
}

export default function OptionSelectionCard({
    content,
    selected,
    showIcon,
    onClick = () => { },
    padding = '12px 20px',
    borderColor = {
        selected: "var(--color-brand)",
        unselected: "var(--color-border-green-subtle)"
    },
    bgColor = {
        selected: "#e8f2fb",
        unselected: "white"
    },
    borderRadius = 4,
    cursor = "pointer"
}: OptionSelectionCardProps) {
    return (
        <Card
            padding={padding} borderRadius={borderRadius} cursor={cursor}
            
            bgcolor={`${selected ? bgColor.selected : bgColor.unselected}`}
            bordercolor={`${selected
                ? borderColor.selected
                : borderColor.unselected}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-center w-full">
                <div className="">
                    {content}
                </div>

                {showIcon && (selected ? (<CheckIconGreen color='#0083ff' size={16} />
                ) : (
                    <div className="border border-border-gray-subtle w-4 h-4 rounded-full"></div>
                ))}
            </div>
        </Card>
    )
}
