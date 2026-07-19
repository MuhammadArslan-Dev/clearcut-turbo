import Image from "next/image";
import React from "react";

type OptionProps = {
  index?: number;
  optiontext?: string;
  imgurl?: string;
};

export default function QOption({ index, optiontext, imgurl }: OptionProps) {
  return (
    <>
      <div className="flex gap-2 items-center h-full">
        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
          {index}
        </div>
        {optiontext && <div className="body-medium font-semibold">{optiontext}</div>}
        {imgurl && <Image src={imgurl} alt="Logo" width={16} height={16} />}
      </div>
    </>
  );
}
