// src/components/layout/Topbar.tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@mui/joy";
import {  ChevronIcon } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import Text from "@clearcut/ui/text";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import ContentPageSwitch from "@/components/features/downloadable-content/components/ContentPageSwitch";

export default function Topbar() {
  const route = useRouter();
  const t = useTranslations("Sidebar");

  const {exam} = useGetCurrentCourseStore();

  return (
    <header className="border-slate-200">
      <div className="h-auto bg-white flex flex-col lg:flex-row lg:gap-3 items-center justify-between ">
        <div className="flex items-center justify-between w-full md:gap-10 px-3 py-2 lg:px-3">
          <div className="flex gap-3 md:gap-10 items-center">
            <Button
              variant="soft"
              color="neutral"
              size="sm"
              sx={{
                borderRadius: "50px",
                padding: "8px 8px",
                height: "36px",
                width: "36px",
              }}
              onClick={() => route.push("/dashboard")}
            >
              <ChevronIcon variant="left" size={16} color="#192839" />
            </Button>
            <div>
              <Text
                as="h2"
                variant="heading-small"
                weight="semibold"
                color="gray-normal"
              >
                {exam?.short_name} Exam
              </Text>
            </div>
          </div>

          <div>
            <ContentPageSwitch />
          </div>
        </div>

       
      </div>
    </header>
  );
}
