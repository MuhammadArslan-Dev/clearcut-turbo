import clsx from "clsx";

/**
 * The pinned bottom bar of the Practice Test attempt and result screens: a real
 * flex child AFTER the scroll area of an `h-screen overflow-hidden` shell (so it
 * is fixed to the bottom of the viewport and never scrolls with the content).
 * One compact white strip on every size - top border (+ soft shadow on phones) -
 * with the buttons aligned under the question column from `lg`; on the attempt
 * screen both sidebar widths are left empty so they line up under it.
 */
export default function PracticeFooter({
  children,
  maxWidth = "max-w-[1280px]",
  withSidebarGutter = false,
  align = "stretch",
}: {
  children: React.ReactNode;
  maxWidth?: string;
  /** Leaves the question screen's two sidebar widths empty so the buttons line up under the question column. */
  withSidebarGutter?: boolean;
  /** "center": the buttons sit together in the middle (result screen) instead of spanning the column. */
  align?: "stretch" | "center";
}) {
  const gutter = <div className="hidden w-[240px] shrink-0 lg:block xl:w-[260px]" aria-hidden="true" />;
  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.06)] lg:px-0 lg:py-2 lg:shadow-none">
      <div className={clsx("mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-4 lg:px-4", maxWidth)}>
        {withSidebarGutter && gutter}
        <div className={clsx("min-w-0 flex-1", align === "center" && "lg:flex lg:justify-center")}>{children}</div>
        {withSidebarGutter && gutter}
      </div>
    </div>
  );
}
