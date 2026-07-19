import React from "react";
import CardWrap from "../cards/card-wrap";
import Image from "next/image";

export default function ExamCard() {
  return (
    <CardWrap borderwidth={1} padding={"12px"}>
      <div className="">
        <div className="flex gap-6 items-center h-full">
          <div className="w-[88px] h-[88px] rounded bg-gray-200 flex items-center justify-center">
            <Image src="/icon/exam.png" alt="Logo" width={16} height={16} />
          </div>
          <div className="">
            <div className="body-medium font-semibold">HTET 2025</div>
            <div className="body-medium font-semibold">Haryana</div>
          </div>
        </div>
      </div>
    </CardWrap>
  );
}
