// src/components/NotificationBanner.tsx

import React from "react";
// We'll use the TagIcon from Heroicons as it matches the image
// import { TagIcon } from "@heroicons/react/24/solid";

/**
 * Props for the NotificationBanner component.
 * This interface makes the component type-safe and documents its API.
 */
interface NotificationBannerProps {
  /** The message to be displayed. Can be a string or other React elements for rich content. */
  message: React.ReactNode;
  /** Optional: A custom icon component to display. Defaults to the TagIcon. */
  Icon?: React.ElementType;
  /** Optional: Additional Tailwind CSS classes to customize the banner's container. */
  className?: string;
}

/**
 * A reusable and scalable notification banner component.
 */
const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  Icon = null, // Default icon is a price tag
  className = "bg-blue-600", // Default background color is blue
}) => {
  return (
    // The main banner container.
    // We add a `role="alert"` for better accessibility.
    <div className={`w-full px-4 py-2.5 text-white ${className}`} role="alert">
      {/* A flex container to center the content vertically and horizontally */}
      <div className="flex items-center justify-center gap-3">
        {/* The Icon component. `flex-shrink-0` prevents the icon from shrinking on small screens. */}
        {/* <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" /> */}

        {/* The message text. `text-center` is a good fallback for text wrapping on small screens. */}
        <p className="text-sm font-medium text-center">{message}</p>
      </div>
    </div>
  );
};

export default NotificationBanner;
