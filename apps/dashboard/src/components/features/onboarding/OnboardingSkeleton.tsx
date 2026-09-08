import Image from "next/image";
import Skeleton from "@clearcut/ui/skeleton";
import { Card } from "@clearcut/ui/card";
import MainContainer from "@/components/ui/main-container";

/**
 * Shown by ProtectedPage (as its `fallback`) only on the onboarding route,
 * for the brief window before `tokenReady` flips true — i.e. before we even
 * know whether the auth check will succeed, so there's no real content to
 * mimic yet beyond "the onboarding shell is about to appear here". Mirrors
 * LanguageStep's actual JSX 1:1 — same wrapper classes (copied verbatim, not
 * approximated) and each text line sized to that line's real typography
 * (`heading-xlarge` line-height ~34px, `body-medium` ~20px, per
 * packages/design-tokens/tokens.css's --flh-hxl/--flh-bm) — so there's no
 * shape/size jump when the real step swaps in. The opposite of the old
 * FullScreenLoader spinner, which was a completely different shape from
 * whatever showed up next.
 */
export default function OnboardingSkeleton() {
  return (
    <div className="w-full h-screen bg-white">
      <MainContainer maxWidth={"max-w-[850px]"} padding="md:pt-14">
        <div className="px-3 py-4 space-y-3">
          <div className="flex flex-col gap-8 items-center">
            {/* "Welcome to" heading + logo — same wrapper as LanguageStep */}
            <div className="px-4 pt-6 mb-2 flex flex-col items-center gap-2 justify-between">
              <Skeleton variant="rectangular" width={150} height={34} borderRadius={4} />
              <Image
                src={"/logos/clear_cutoff_logo.png"}
                width={239}
                height={48}
                alt="Main Logo"
                className="w-[239px] h-[48px]"
                priority
              />
            </div>
            {/* "Choose Your Language" heading + description — same wrapper */}
            <div className="px-4 py-3 flex flex-col items-center gap-2">
              <Skeleton variant="rectangular" width={280} height={34} borderRadius={4} />
              <Skeleton variant="rectangular" width={200} height={20} borderRadius={4} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 py-4">
            {[0, 1].map((i) => (
              <Card key={i} padding={"12px 20px"} borderRadius={4} bgcolor="white" bordercolor="#eee">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="rectangular" width={70} height={20} borderRadius={4} />
                  </div>
                  <div className="border border-[var(--surface-border-gray-subtle)] w-4 h-4 rounded-full shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto">
          <Skeleton variant="rectangular" width="100%" height={44} borderRadius={999} />
        </div>
      </MainContainer>
    </div>
  );
}
