import { IMAGES } from "@/constants/images";
import Image from "next/image";

type TickProps = {
    variant?: string;
    color?: keyof typeof IMAGES.tick.checked;
    width?: number;
    height?: number;
};

export default function Tick({
    variant = "checked",
    color = "blue",
    
    width = 24,
    height = 24,
}: TickProps) {

    // No `priority`. These are 20-24px decorative ticks rendered many times per
    // page (feature lists, pricing tables). `priority` disables lazy-loading AND
    // injects a <link rel="preload"> per instance, so a handful of icons compete
    // for early bandwidth with the real LCP image. Icons are never the LCP
    // element, so lazy-loading them is strictly correct.
    if (variant === "unchecked") {
        return <Image src={IMAGES.tick.unchecked} alt="tick" width={width} height={height}
  unoptimized/>;
    }

    return <Image src={IMAGES.tick.checked[color]} alt="tick" width={20} height={20}
  unoptimized   />;
}