import CountdownBanner from "@/components/banner/countdownbanner";
import Header from "@/components/blog/header";
import Footer from "@/components/landing/footer/footer";
import React from "react";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <CountdownBanner message="Flash Sale Ends In" />
      <Header />
      {/* Main Layout (sidebars fixed, main scrolls) */}
      <div className="flex flex-1 mx-auto w-full relative">
        {/* Left Sidebar (fixed) */}
        {/* <LeftSidebar /> */}

        {/* Main content. NOTE: no `overflow-y-auto` here — the page scrolls at
            the window level, and an overflow ancestor would break
            `position: sticky` descendants (e.g. the article Contents sidebar). */}
        <main className="flex-1 min-w-0">
            {children}
        </main>

        {/* Right Sidebar (fixed) */}
        {/* <RightSidebar /> */}
      </div>
      <Footer />
    </div>
  );
}
