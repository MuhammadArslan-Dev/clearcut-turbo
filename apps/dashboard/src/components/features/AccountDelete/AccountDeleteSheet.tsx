import { useIsMobile } from "@/hooks/useIsMobile";
import React, { useCallback, useMemo } from "react";
import { BottomSheet } from "../Sheets/BottomSheet";
import { Modal } from "../Sheets/Modal";
import { AnimatePresence } from "framer-motion";
import Text from "@clearcut/ui/text";
import { CrossIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";
import { useModalStore } from "@/store/modal/useModalStore";
import { Button } from "@clearcut/ui/button";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import { deleteAccount } from "@/lib/api/auth";

export default function AccountDeleteSheet() {
  const isMobile = useIsMobile();
  const { isOpen, closeModal, stack, open } = useModalStore();
  const active = stack[stack.length - 1];

  const goBack = useCallback(() => {
    if (isOpen) {
      closeModal("account-delete");
    }
    // reset();
  }, []);

  const accountDelete = useCallback(async () => {
    if (isOpen) {
      const req = await deleteAccount();
      if (req?.status === 'success') {
        closeModal("account-delete");
        open("account-delete-confirm");
      }
    }
  }, []);

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);
  return (
    <AnimatePresence>
      {isOpen && active === "account-delete" && (
        <Container
          key="account-delete"
          isHeader={false}
          titleClass="heading-medium !font-semibold"
          maxWidth="md:max-w-[350px]"
          isOpen={isOpen}
          onClose={() => goBack()}
        >
          <div className="bg-white h-full flex flex-col max-h-[90vh] overflow-y-auto justify-between">
            <Header
              onClose={() => {
                goBack();
              }}
            />
            <div className="py-3 flex flex-col gap-6 px-5">
              <div>
                <Text
                  as="p"
                  variant="body-medium"
                  weight="normal"
                  color="gray-muted"
                >
                  Once you delete your account, you will not have access to any
                  of the courses. We will also delete your data from our
                  servers.
                </Text>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <WarningCirleIcon color="red" />
                  <Text
                    as="p"
                    variant="body-medium"
                    weight="normal"
                    className="text-red-500"
                  >
                    This process will not be reveresed
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <WarningCirleIcon color="#c65c10" />
                  <Text
                    as="p"
                    variant="body-medium"
                    weight="normal"
                    className="!text-[#c65c10]"
                  >
                    You can create a new account only if needed
                  </Text>
                </div>
              </div>
            </div>
            <Footer
              goBack={() => {
                goBack();
              }}
              onDelete={() => {
                accountDelete();
              }}
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
          variant="heading-small"
          weight="semibold"
          color="gray-normal"
        >
          Do you want to delete your account?
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
  onDelete,
  goBack,
}: {
  goBack?: () => void;
  onDelete?: () => void;
}) {
  const changeP = useTranslations("modals.changePaper");

  return (
    <div className="sticky bottom-0 z-10 px-3 py-2 bg-white">
      <div className="w-full flex justify-center md:gap-6 max-w-[400px]">
        <Button
          sx={{
            borderRadius: "50px",
          }}
          onClick={goBack}
          size="md"
          variant="soft"
          color="gray"
          fullWidth
        >
          <div className="flex body-large !font-semibold gap-1 items-center">
            Go Back
          </div>
        </Button>
        <Button
          sx={{
            borderRadius: "50px",
          }}
          onClick={onDelete}
          size="md"
          color="danger"
          fullWidth
        >
          <div className="flex body-large !font-semibold gap-1 items-center">
            Delete Account
          </div>
        </Button>
      </div>
    </div>
  );
});
