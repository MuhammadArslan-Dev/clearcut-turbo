import clsx from "clsx";
import Image from "next/image";

/**
 * Shared phone frame for the App-Download pages. Fills a real app screenshot
 * edge-to-edge behind the notch.
 */
export default function PhoneMockup({
  screenshotSrc,
  alt = "Clear Cutoff app screenshot",
  className,
  widthClassName = "w-[280px] sm:w-[300px]",
}: {
  screenshotSrc: string;
  alt?: string;
  className?: string;
  widthClassName?: string;
}) {
  return (
    <div
      className={clsx(
        "relative mx-auto rounded-[2.2rem] border-[6px] border-[var(--color-text-gray-normal)] bg-white shadow-xl overflow-hidden",
        widthClassName,
        className,
      )}
      style={{ aspectRatio: "9 / 19.5" }}
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-5 w-24 rounded-b-xl bg-[var(--color-text-gray-normal)] z-10" />
      <Image src={screenshotSrc} alt={alt} fill sizes="300px" priority className="object-cover object-top" />
    </div>
  );
}
