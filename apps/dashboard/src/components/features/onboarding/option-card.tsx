import { Card } from "@clearcut/ui/card";
import React from 'react'

interface OptionCardProps {
    text: string;
    onClick: () => void;
    padding?: string;
    bordercolor?: string;
}

export default function OptionCard({
    text,
    onClick,
    padding='12px 16px',
    bordercolor
}: OptionCardProps) {
    return (
        <Card
            bordercolor={bordercolor}
            padding={padding}
            onClick={onClick}
            className="cursor-pointer hover:shadow-sm transition"
        >
            <p className="body-medium !font-normal text-surface-gray-normal">{text}</p>
        </Card>
    )
}
