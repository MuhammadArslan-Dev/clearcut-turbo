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

    if (variant === "unchecked") {
        return <Image src={IMAGES.tick.unchecked} alt="tick" width={width} height={height}  priority
  unoptimized/>;
    }

    return <Image src={IMAGES.tick.checked[color]} alt="tick" width={20} height={20}  priority
  unoptimized   />;
}