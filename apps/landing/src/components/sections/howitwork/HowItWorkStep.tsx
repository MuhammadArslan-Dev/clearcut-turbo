"use client";
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";
import Paragraph from "@/components/shared/text-render/Paragraph";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import { useActiveStep } from "@/hooks/useActiveStep";
import clsx from "clsx";
import React from "react";

export default function HowItWorkStep({ steps }: { steps: any[] }) {
  const activeStep = useActiveStep(steps.map((s) => s.id));

  return (
    <div className="space-y-16">
      {steps.map((step) => {
        const isActive = activeStep === step.id;

        return (
          <div
            id={step.id}
            key={step.id}
            className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-20"
          >
            {/* 🔹 LEFT TEXT */}

            <div className="order-2 md:order-1">
              <div className="flex items-start gap-3">
                {/* MOBILE BADGE */}

                <div className="md:hidden w-8 flex flex-col gap-2 h-full items-center">
                  <div
                    className={clsx(
                      "rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mt-1 transition",
                      isActive
                        ? "bg-brand text-white"
                        : "bg-gray-300 text-gray-700",
                    )}
                  >
                    {step.number}
                  </div>

                  <div
                    className={clsx(
                      "h-[220px] w-0.5",
                      isActive ? "bg-brand" : "bg-gray-300",
                    )}
                  />
                </div>

                <Content {...step} />
              </div>
            </div>

            {/* 🔹 CENTER STEPPER */}

            <div className="hidden md:flex justify-center order-2">
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition-all duration-300",
                  isActive
                    ? "bg-brand text-white scale-110 shadow-lg"
                    : "bg-gray-300 text-gray-600",
                )}
              >
                {step.number}
              </div>
            </div>

            {/* 🔹 RIGHT CARD */}

            <div className="order-3">
              <div
                className={clsx(
                  "rounded-2xl bg-transparent transition-all duration-300",
                )}
              >
                {step.image}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const Content = function Content({
  title,
  subtitle,
  desc,
  btn,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  desc: React.ReactNode;
  btn: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <HeaderBlock
        heading={{ text: title }}
        description={{ text: subtitle }}
        headingOptions={{
          alignMobile: "left",
          alignDesktop: "left",
          font: "heading-xlarge !font-semibold",
        }}
        descriptionOptions={{
          font: "heading-medium !font-semibold",
          color: "text-text-gray-normal",
          alignMobile: "left",
          alignDesktop: "left",
        }}
        headingClassName="mb-5"
      />

      <Paragraph
        text={{ text: desc }}
        textOptions={{
          font: "body-large !font-normal",
          color: "text-text-gray-muted",
          alignMobile: "left",
          alignDesktop: "left",
        }}
      />

      <div className="w-[250px]">
        <ContinueFreeButton
          event={{ element_location: "howitwork" }}
          variant="outlined"
          fullWidth
          text={btn}
        />
      </div>
    </div>
  );
};
