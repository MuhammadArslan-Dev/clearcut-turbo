import { Link } from "@clearcut/i18n/navigation";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import MainAppLogo from "@/components/icons/main-app-logo";
import NavbarMenu from "@/components/ui/NavLink";
import HeaderWraper from "./HeaderWraper";
import Image from "next/image";
import { IMAGES } from "@/constants/images";

export default function Header({ items = [], linkShow = true }: any) {
  return (
    <HeaderWraper>
      <nav className="h-[64px] container mx-auto px-4 flex items-center max-w-7xl justify-between">
        <Link href="/" className="">
          <Image
            src={IMAGES.mainLogo}
            alt="Main logo"
            // main-logo.svg's own viewBox is 127.12 x 24.88 (~5.1:1, a wide
            // wordmark) — width/height here were 190x160 (~1.2:1), so the
            // browser reserved a tall near-square box before the SVG loaded,
            // then had to shrink it to the SVG's real ratio once it did.
            // That reflow was the single largest Cumulative Layout Shift
            // contributor on this page. Matching the real ratio here doesn't
            // change how the logo looks (it already renders at its correct
            // ratio today) — it just reserves the right space from the start.
            width={190}
            height={37}
            priority
            sizes="(max-width: 768px) 120px, 190px"
          />
        </Link>

        {linkShow && (
          <div className="hidden md:block">
            <NavbarMenu items={items} />
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-8">
          <div className="hidden md:block w-[200px]">
            <ContinueFreeButton showShimmer fullWidth size="md" />
          </div>
        </div>
      </nav>
    </HeaderWraper>
  );
}
