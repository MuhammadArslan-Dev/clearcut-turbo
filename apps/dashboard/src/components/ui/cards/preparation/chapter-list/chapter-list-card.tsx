import React from 'react';
import clsx from 'clsx';

interface ChapterListCardProps {
    /**
     * The title of the chapter
     */
    title: string;

    /**
     * The name or number of the chapter
     */
    chapterName?: string;

    /**
     * Optional description text
     */
    description?: string;

    /**
     * Whether the chapter is currently active/selected
     */
    isActive?: boolean;

    /**
     * Callback when the card is clicked
     */
    onClick?: () => void;

    /**
     * Additional CSS classes for the card
     */
    className?: string;

    /**
     * Optional badge count (e.g., number of topics)
     */
    badgeCount?: number;

    /**
     * Whether to show a completion status
     */
    isCompleted?: boolean;

    /**
     * Optional icon to display before the title
     */
    icon?: React.ReactNode;
}

const ChapterListCard: React.FC<ChapterListCardProps> = ({
    title,
    chapterName,
    description,
    isActive = false,
    onClick,
    className = '',
    badgeCount,
    isCompleted = false,
    icon        
}) => {
    return (
        <div
            className={clsx(
                'p-4 rounded-lg transition-colors duration-200',
                'border border-gray-200 hover:border-blue-300',
                'bg-white',
                isActive ? 'ring-2 ring-blue-500' : 'hover:shadow-sm',
                'cursor-pointer',
                className
            )}
            onClick={onClick}
            role="button"
            tabIndex={0}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                    {icon && (
                        <div className="mt-0.5">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="font-medium text-gray-900">
                            {title}
                        </h3>
                        {chapterName && (
                            <p className="text-sm text-gray-500">
                                {chapterName}
                            </p>
                        )}
                        {description && (
                            <p className="mt-1 text-sm text-gray-600">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {badgeCount !== undefined && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {badgeCount}
                        </span>
                    )}
                    {isCompleted && (
                        <span className="inline-flex items-center text-green-600">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChapterListCard;
