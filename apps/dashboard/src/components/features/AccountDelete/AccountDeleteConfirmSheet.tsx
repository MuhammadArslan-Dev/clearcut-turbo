import { useIsMobile } from "@/hooks/useIsMobile";
import React, { useCallback, useEffect, useMemo } from "react";
import { BottomSheet } from "../Sheets/BottomSheet";
import { Modal } from "../Sheets/Modal";
import { AnimatePresence } from "framer-motion";
import Text from "@clearcut/ui/text";
import { CheckIcon, CrossIcon } from "@/components/ui/icons";
import { useModalStore } from "@/store/modal/useModalStore";
export default function AccountDeleteConfirmSheet() {
  const isMobile = useIsMobile();
  const { isOpen, closeModal, stack } = useModalStore();
  const active = stack[stack.length - 1];
  const goBack = useCallback(() => {
    if (isOpen) {
      closeModal("account-delete-confirm");
    }
    // reset();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        goBack();
        window.location.reload();
      }, 1500);
    }
  }, [isOpen]);

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);
  return (
    <AnimatePresence>
      {isOpen && active === "account-delete-confirm" && (
        <Container
          isHeader={false}
          isOpen={true}
          maxWidth="md:max-w-[430px]"
          onClose={() => {}}
        >
          <div className="bg-white h-full flex flex-col max-h-[90vh] overflow-y-auto justify-between">
            <Header
              onClose={() => {
                goBack();
              }}
            />
            <div className="text-center py-3 flex flex-col gap-6">
              <div className="flex items-center gap-5 justify-center flex-col">
                <CheckIcon variant="design" color="#47c347" size={48} />

                <Text as="p" variant="body-medium" weight="semibold">
                  Account Deleted
                </Text>
              </div>
              <Text as="p" variant="body-medium" color="gray-muted">
                Redirecting to the Start with Clear Cutoff Page ...{" "}
              </Text>
            </div>
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
  return (
    <div className="sticky top-0 z-10 flex justify-between gap-4 px-4 py-3 bg-white">
      <div>
        <Text
          as="h6"
          variant="heading-small"
          weight="semibold"
          color="gray-normal"
        >
          Account Deleted
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
