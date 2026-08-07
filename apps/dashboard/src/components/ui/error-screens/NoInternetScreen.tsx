"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import ErrorPageLayout from "./ErrorPageLayout";
import Image from "next/image";
import { IMAGES } from "@/constants/images";


export default function NoInternetScreen() {
  const router = useRouter();

  return (
    <ErrorPageLayout>
      <div className="w-full max-w-4xl">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Illustration */}
          <div className="w-full md:w-[55%] max-w-sm md:max-w-none">
            <Image src={IMAGES.error.nointernet} alt="No Internet Error" width={500} height={400} className="w-full h-auto" />
          </div>

          {/* Text content */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            {/* Heading */}
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#0083FF] leading-tight">
              No
              <br />
              Internet!
            </h1>

            {/* Sub heading */}
            <p className="text-gray-800 font-semibold text-base">
              Internet Not Found!
            </p>

            {/* Message */}
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Please check your WiFi or Mobile data and refresh the page!
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0083FF] text-white text-sm font-semibold rounded-lg hover:bg-[#006bd1] transition-colors"
              >
                <ArrowLeft size={16} />
                Go Back
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-[#0083FF] text-[#0083FF] text-sm font-semibold rounded-lg hover:bg-[#0083FF] hover:text-white transition-colors"
              >
                <Home size={16} />
                Go to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
