import React from "react";
import clsx from "clsx";
import { getAlignmentClasses } from "@clearcut/utils/highlight-text";
import { TextVariant } from "@/types/heading-block";
import { Align } from "@/types/textType";
import Paragraph from "./Paragraph";

interface TextControl {
  alignMobile?: Align;
  alignDesktop?: Align;
  color?: string;
  font?: string;
}

interface HeaderBlockProps {
  eyebrow?: TextVariant;
  heading: TextVariant;
  description?: TextVariant;

  eyebrowOptions?: TextControl;
  headingOptions?: TextControl;
  descriptionOptions?: TextControl;

  containerClassName?: string;
  eyebrowClassName?: string;
  headingClassName?: string;
  descriptionClassName?: string;
}

const HeaderBlock: React.FC<HeaderBlockProps> = ({
  eyebrow,
  heading,
  description,
  eyebrowOptions = { color: "text-brand" },
  headingOptions,
  descriptionOptions,
  containerClassName,
  eyebrowClassName = "mb-1",
  headingClassName,
  descriptionClassName,
}) => {
  const mergedEyebrowOptions = {
    color: "text-brand",
    font: "body-medium !font-semibold",
    ...eyebrowOptions,
  };

  return (
    <div className={clsx("w-full", containerClassName)}>
      {eyebrow?.text && (
        <Paragraph
          className={eyebrowClassName}
          text={eyebrow}
          textOptions={mergedEyebrowOptions}
        />
      )}

      <h2
        className={clsx(
          "",
          headingClassName ?? "mb-3",
          getAlignmentClasses(
            headingOptions?.alignMobile,
            headingOptions?.alignDesktop,
          ),
          headingOptions?.font ?? "display-medium !font-semibold",
          headingOptions?.color ?? "text-text-gray-normal",
        )}
      >
        {heading.text}
      </h2>

      {description?.text && (
        <Paragraph
          className={descriptionClassName}
          text={description}
          textOptions={descriptionOptions}
        />
      )}
    </div>
  );
};

export default HeaderBlock;
