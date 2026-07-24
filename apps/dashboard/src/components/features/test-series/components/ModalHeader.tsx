import { CrossIcon } from "@/components/ui/icons";
import Text from "@clearcut/ui/text";
import React from "react";

export default function ModalHeader({
  onClose,
  title,
  titleClass,
  subtitle,
  subtitleClass,
}: {
  title: string;
  subtitle?: string;
  titleClass?: string;
  subtitleClass?: string;
  onClose: () => void;
}) {
  return (
    <div className="sticky w-full top-0 z-10 flex px-3 py-4 bg-white justify-between">
      <div className="w-full">
        <div className="w-full flex items-center justify-between">
          <Text variant="heading-medium" weight="semibold" className={titleClass}>
            {title}
          </Text>

          <button className="cursor-pointer" onClick={onClose}>
            <CrossIcon />
          </button>
        </div>
        {subtitle && (
          <Text as="p" variant="body-small" color="gray-muted" className={subtitleClass}>
            {subtitle}
          </Text>
        )}
      </div>
    </div>
  );
}
