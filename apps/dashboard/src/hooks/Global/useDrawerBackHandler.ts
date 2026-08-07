import { useCourseStore } from "@/store/course/useCourseStore";
import { useBackHandler } from "./useBackHandler";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";

export const useDrawerBackHandler = () => {
  const { isOpen, close } = useCourseStore();
  const { isOpen : isOpenPaywall  , close: closePaywall } = usePaywallsStore();
  const handleClose = () => {
    closePaywall();
    close();
  };

  const isOpenM = isOpen || isOpenPaywall;

  useBackHandler({
    isOpen : isOpenM,
    onClose: handleClose,
  });
};
