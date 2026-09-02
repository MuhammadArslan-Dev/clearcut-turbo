import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ToolBreadcrumbs from "./ToolBreadcrumbs";
import ResizeImageTool, { PresetKey } from "./ResizeImageTool";
import { FadeIn } from "./motion";

interface ToolLandingPageProps {
  /** Breadcrumb label for this tool. */
  crumbLabel: string;
  heading: string;
  description: string;
  defaultPreset: PresetKey;
}

/**
 * Shared template for the standalone tool pages (/custom, /add-name-date,
 * /image-compressor, /signature-compressor, /75-face-coverage) — each is
 * the SAME ResizeImageTool opened directly into a specific preset rather
 * than a distinct implementation, mirroring how ResizerSpokePage/
 * CategoryPage are one template reused per exam/category instead of a
 * hand-written page per URL. The face/head guide on the crop screen shows
 * automatically for the Photo/Add Name presets — it isn't something this
 * page opts into.
 */
export default function ToolLandingPage({ crumbLabel, heading, description, defaultPreset }: ToolLandingPageProps) {
  return (
    <div>
      <SiteHeader />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-[1080px] mx-auto px-2 mb-6">
          <ToolBreadcrumbs items={[{ name: "Home", url: "/" }, { name: crumbLabel }]} />
        </div>

        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-large md:!text-[40px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            {heading}
          </h1>
          <p className="body-medium text-text-gray-muted">{description}</p>
        </FadeIn>

        <ResizeImageTool defaultPreset={defaultPreset} />
      </div>

      <SiteFooter />
    </div>
  );
}
