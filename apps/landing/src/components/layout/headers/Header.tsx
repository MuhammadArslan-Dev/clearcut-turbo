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
            width={190}
            height={160}
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
