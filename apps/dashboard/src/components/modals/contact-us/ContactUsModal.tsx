import React, { useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CustomBottomSheet, CustomModal } from "../modals-bottom-sheet";
import { useTranslations } from "next-intl";
import { CrossIcon, PhoneIcon, WhatsappIcon } from "@/components/ui/icons";
import ProfileItemList from "@/components/ui/widgets/ProfileItemList";
import { useModalStore } from "@/store/modal/useModalStore";
import { AnimatePresence } from "framer-motion";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";

interface ContactUsModalProps {
  phoneNumber?: string; // e.g. "+919999999999"
  whatsappNumber?: string; // optional: falls back to phoneNumber if not provided
  defaultWhatsappMessage?: string;
}

export default function ContactUsModal({
  phoneNumber = "+919999999999",
  whatsappNumber = "+919999999999",
  defaultWhatsappMessage = "Hi, I need help.",
}: ContactUsModalProps) {
  const isMobile = useIsMobile();
  const support = useTranslations("modals.support");
const { isOpen, closeModal, stack } = useModalStore();
  const active = stack[stack.length - 1];
  /* ---------------------------------- container (stable) ---------------------------------- */
  const Container = useMemo(
    () => (isMobile ? BottomSheet : Modal),
    [isMobile]
  );

  /* ---------------------------------- normalized values ---------------------------------- */
  const normalizedPhone = useMemo(
    () => phoneNumber.trim(),
    [phoneNumber]
  );

  const normalizedWhatsApp = useMemo(
    () =>
      (whatsappNumber || phoneNumber || "").replace(/[^\d]/g, ""),
    [whatsappNumber, phoneNumber]
  );

  /* ---------------------------------- handlers ---------------------------------- */
  const handleCallClick = useCallback(() => {
    if (!normalizedPhone || typeof window === "undefined") return;
    window.location.href = `tel:${normalizedPhone}`;
    closeModal("helpsport");
  }, [normalizedPhone, closeModal]);

  const handleWhatsAppClick = useCallback(() => {
    if (!normalizedWhatsApp || typeof window === "undefined") return;
    const encodedMessage = encodeURIComponent(defaultWhatsappMessage);
    const url = `https://wa.me/${normalizedWhatsApp}?text=${encodedMessage}`;
    window.open(url, "_blank");
    closeModal("helpsport");
  }, [normalizedWhatsApp, defaultWhatsappMessage, closeModal]);

  /* ---------------------------------- options (memoized) ---------------------------------- */
  const options = useMemo(
    () => [
      {
        id: "phone",
        Icon: PhoneIcon,
        title: support("callUs.title"),
        subtitle: support("callUs.subtitle"),
        onClick: handleCallClick,
      },
      {
        id: "whatsapp",
        Icon: WhatsappIcon,
        title: support("chatUs.title"),
        subtitle: support("chatUs.subtitle"),
        onClick: handleWhatsAppClick,
      },
    ],
    [support, handleCallClick, handleWhatsAppClick]
  );

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && active === "helpsport" && (
        <Container
          maxWidth="md:max-w-[320px]"
          isHeader={false}
          title={support("title")}
          isOpen={isOpen}
          onClose={() => closeModal("helpsport")}
        >
          <div className="px-4 py-5 flex flex-col gap-6">
            <div className="flex justify-between">
              <h6 className="heading-medium !font-semibold">
                {support("title")}
              </h6>
              <div
                className="cursor-pointer"
                onClick={() => closeModal("helpsport")}
              >
                <CrossIcon />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {options.map(({ id, Icon, title, subtitle, onClick }) => (
                <ProfileItemList
                  key={id}
                  titleClass="body-large !font-semibold"
                  subtitleClass="body-medium !font-normal"
                  icon={
                    <Icon
                      color="var(--color-surface-gray-subtle)"
                      size={24}
                    />
                  }
                  title={title}
                  subtitle={subtitle}
                  onClick={onClick}
                  showEditIcon
                />
              ))}
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}
