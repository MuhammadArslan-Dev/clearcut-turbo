"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import React, { useMemo } from "react";
import { ChevronIcon, CrossIcon } from "@/components/ui/icons";
import { AnimatePresence } from "framer-motion";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { useTranslations } from "next-intl";
import { useAddPaper } from "../../hooks/useAddPaper";

export default function ChangePaperModal() {
  const isMobile = useIsMobile();
  const { isOpen, closeModal, stack } = usePreparationModalStore();
  const [selected, setSelected] = React.useState<string | null>(null);
  const { locale } = useLanguageSwitch();
  const changeP = useTranslations("modals.changePaper");

  useBackHandler({
    isOpen,
    onClose: () => closeModal("change-paper"),
  });

  const { selectedPaperId, papers, selectPaper, loading } =
    usePreparationStore();

  React.useEffect(() => {
    setSelected(selectedPaperId?.toString() ?? null);
  }, [selectedPaperId]);

  const items = React.useMemo(
    () =>
      papers.map((paper) => {
        const parsedName = JSON.parse(paper.name);
        return {
          id: paper.id.toString(),
          label: parsedName?.[locale]?.name,
          group: parsedName?.[locale]?.group,
        };
      }),
    [papers],
  );

  const handleSelect = (id: string) => {
    setSelected(id);
    // closeModal("change-paper");
  };

  const handleChangePaper = () => {
    selectPaper(Number(selected));
    closeModal("change-paper");
  };

  const { canAddPaper, openAddPaper } = useAddPaper();

  // Close this modal before opening the edit one — leaving both mounted stacks
  // a Modal on top of a Modal, and this one owns the mobile history entry via
  // useBackHandler.
  const handleAddPaper = () => {
    closeModal("change-paper");
    openAddPaper();
  };

  const active = stack.at(-1); // safe
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  return (
    <AnimatePresence>
      {isOpen && active === "change-paper" && (
        <Container
          key="change-paper"
          isHeader={false}
          titleClass="heading-medium !font-semibold"
          maxWidth="md:max-w-[320px]"
          isOpen={isOpen}
          onClose={() => closeModal("change-paper")}
        >
          <div className="bg-white h-full flex flex-col max-h-[90vh] overflow-y-auto justify-between">
            <Header onClose={() => closeModal("change-paper")} />

            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto px-3 py-2">
              {items?.map((paper, index) => (
                <OptionSelectionCard
                  key={paper.id}
                  padding="8px 20px"
                  selected={paper?.id === selected?.toString()}
                  showIcon
                  onClick={() => {
                    handleSelect(paper.id.toString());
                  }}
                  content={
                    <span className="flex flex-col items-start">
                      <Text
                        as="h6"
                        variant="heading-medium"
                        weight="semibold"
                        color="gray-normal"
                      >
                        {paper?.label}
                      </Text>
                      <Text as="p" variant="body-small" weight="normal" color="gray-muted">
                        {paper?.group}
                      </Text>

                     
                    </span>
                  }
                />
              ))}
            </div>
            <Footer
              onResult={handleChangePaper}
              onAddPaper={canAddPaper ? handleAddPaper : undefined}
            />
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

const Header = React.memo(function Header({
  onClose,
}: {
  onClose: () => void;
}) {
  const changeP = useTranslations("modals.changePaper");

  return (
    <div className="sticky top-0 z-10 flex justify-between gap-4 px-4 py-3 bg-white">
      <div>
        <Text
          as="h6"
          variant="heading-medium"
          weight="semibold"
          color="gray-normal"
        >
          {changeP("title")}
        </Text>
        <Text as="p" variant="body-small" weight="normal" color="gray-muted">
          {changeP("subtitle")}
        </Text>
      </div>
      <button
        type="button"
        className="cursor-pointer"
        onClick={onClose}
        aria-label="Go back"
      >
        <CrossIcon size={24} />
      </button>
    </div>
  );
});

const Footer = React.memo(function Footer({
  onResult,
  onAddPaper,
}: {
  onResult?: () => void;
  /** Omitted when the user already owns every paper, or is out of edits. */
  onAddPaper?: () => void;
}) {
  const changeP = useTranslations("modals.changePaper");
  const addP = useTranslations("modals.addPaper");

  return (
    <div className="sticky bottom-0 z-10 px-3 py-2 bg-white">
      <div className="w-full flex flex-col items-center gap-4">
        <div className="w-full flex flex-col items-center gap-1">
          <div className="w-full flex flex-col items-center gap-2 max-w-[400px]">
            <Button
              sx={{
                borderRadius: "50px",
              }}
              onClick={onResult}
              size="lg"
              color="primary"
              fullWidth
            >
              <div className="flex body-large !font-semibold gap-1 items-center">
                {changeP("continueButton")}
              </div>
            </Button>

            {onAddPaper && (
              <Button
                sx={{
                  borderRadius: "50px",
                }}
                onClick={onAddPaper}
                size="lg"
                variant="outlined"
                fullWidth
              >
                <div className="flex body-large !font-semibold gap-1 items-center">
                  {addP("title")}
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
