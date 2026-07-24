"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import ErrorPageLayout from "./ErrorPageLayout";
import { IMAGES } from "@/constants/images";
import Image from "next/image";


export default function Error500Screen() {
  const router = useRouter();

  return (
    <ErrorPageLayout>
      <div className="w-full max-w-4xl">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Illustration */}
          <div className="w-full md:w-[55%] max-w-sm md:max-w-none">
            <Image src={IMAGES.error[500]} alt="500 Error" width={500} height={400} className="w-full h-auto" />
          </div>

          {/* Text content */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            {/* 500 number */}
            <h1 className="text-8xl md:text-9xl font-extrabold text-[#0083FF] leading-none">
              500
            </h1>

            {/* Error badge */}
            <span className="inline-flex items-center bg-yellow-300 text-gray-800 text-sm font-bold px-3 py-1 rounded">
              Error 500!
            </span>

            {/* Message */}
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Internal Server <span className="bg-yellow-200 px-0.5">error</span> has occurred! Don&apos;t worry!
              <br />
              Our team is investigating it!
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
