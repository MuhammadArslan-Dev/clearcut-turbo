import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ResizeImageTool, { PresetKey } from "./ResizeImageTool";
import ToolModeTabs from "./ToolModeTabs";
import { FadeIn } from "./motion";
import { Locale } from "@/lib/dictionary";

interface ToolLandingPageProps {
  heading: string;
  description: string;
  defaultPreset: PresetKey;
  /** Shows the Image Resizer / Add Name & Date switcher above the tool card — only the Add Name & Date page opts in, since it's the one other primary mode the hub itself switches to. The other standalone tools (/image-compressor, /signature-compressor, /75-face-coverage) stay reachable via the "More tools" grid instead. */
  showModeTabs?: boolean;
  /** Hides the "Document type" tile grid — the Add Name & Date page is its own dedicated form in the reference, not a mode picked from a tile grid. Defaults to shown. */
  showPresetPicker?: boolean;
  locale?: Locale;
  /** Extra sections (How it works / feature highlights / FAQ) rendered below the tool card — only the Add Name & Date page uses this so far. */
  children?: React.ReactNode;
}

/**
 * Shared template for the standalone tool pages (/add-name-date,
 * /image-compressor, /signature-compressor, /75-face-coverage) — each is
 * the SAME ResizeImageTool opened directly into a specific preset rather
 * than a distinct implementation, mirroring how ResizerSpokePage/
 * CategoryPage are one template reused per exam/category instead of a
 * hand-written page per URL. The face/head guide on the crop screen shows
 * automatically for the Photo/Add Name presets — it isn't something this
 * page opts into.
 */
export default function ToolLandingPage({
  heading,
  description,
  defaultPreset,
  showModeTabs = false,
  showPresetPicker = true,
  locale = "en",
  children,
}: ToolLandingPageProps) {
  return (
    <div>
      <SiteHeader locale={locale} />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-xlarge !text-[32px] md:!text-[48px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            {heading}
          </h1>
          <p className="body-large !text-[17px] md:!text-[19px] text-text-gray-muted">{description}</p>
        </FadeIn>

        {showModeTabs && <ToolModeTabs locale={locale} activeTab="addNameDate" />}

        <ResizeImageTool defaultPreset={defaultPreset} showPresetPicker={showPresetPicker} locale={locale} />

        {children}
      </div>

      <SiteFooter locale={locale} />
    </div>
  );
}
