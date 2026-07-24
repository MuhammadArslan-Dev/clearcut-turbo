import { ArrowIcon } from "../icons";

type Props = {
  onBack: () => void;
  label?: string;
};

export function MobileBackButton({ onBack, label = "Back" }: Props) {
  return (
    <div className=" sticky top-0 z-10 bg-white">
      <div className="h-[70px] flex items-center px-3">
        <button
          onClick={onBack}
          className="heading-sm flex items-center !font-semibold text-surface-gray-normal"
        >
          <ArrowIcon /> <p>{label}</p>
        </button>
      </div>
    </div>
  );
}
