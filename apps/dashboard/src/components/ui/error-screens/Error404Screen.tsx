"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import ErrorPageLayout from "./ErrorPageLayout";
import Image from "next/image";
import { IMAGES } from "@/constants/images";

function DesertIllustration() {
  return (
    <svg
      viewBox="0 0 520 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Blob background */}
      <path
        d="M30 290 C10 260 0 200 10 150 C20 90 60 40 120 20 C180 0 270 10 340 30 C410 50 470 90 490 150 C510 210 500 270 470 300 C440 330 380 345 300 350 C220 355 140 350 80 330 C55 322 40 308 30 290 Z"
        fill="white"
        opacity="0.95"
      />

      {/* Ground / hills */}
      <ellipse cx="240" cy="300" rx="200" ry="40" fill="#d4c5a0" opacity="0.5" />
      <ellipse cx="130" cy="310" rx="120" ry="30" fill="#c9b98a" opacity="0.4" />

      {/* Moon / rock - upper right inside blob */}
      <circle cx="360" cy="65" r="38" fill="#8aaed4" opacity="0.6" />
      <circle cx="348" cy="57" r="6" fill="#7099c2" opacity="0.5" />
      <circle cx="368" cy="75" r="4" fill="#7099c2" opacity="0.5" />
      <circle cx="355" cy="80" r="3" fill="#7099c2" opacity="0.4" />

      {/* Small floating rocks */}
      <circle cx="410" cy="100" r="12" fill="#5b87bd" opacity="0.55" />
      <circle cx="400" cy="112" r="5" fill="#4a77ad" opacity="0.5" />
      <circle cx="430" cy="95" r="8" fill="#6a93c5" opacity="0.5" />

      {/* Tall cactus - left */}
      <rect x="95" y="175" width="22" height="100" rx="11" fill="#4a9d6f" />
      {/* Left arm */}
      <rect x="73" y="215" width="22" height="12" rx="6" fill="#4a9d6f" />
      <rect x="73" y="205" width="12" height="28" rx="6" fill="#4a9d6f" />
      {/* Right arm */}
      <rect x="117" y="225" width="22" height="12" rx="6" fill="#4a9d6f" />
      <rect x="127" y="215" width="12" height="28" rx="6" fill="#4a9d6f" />
      {/* Cactus shading */}
      <rect x="100" y="175" width="8" height="100" rx="4" fill="#3a8a5e" opacity="0.4" />

      {/* Small cactus - right of main one */}
      <rect x="175" y="225" width="14" height="65" rx="7" fill="#4a9d6f" />
      <rect x="161" y="250" width="14" height="8" rx="4" fill="#4a9d6f" />
      <rect x="161" y="244" width="8" height="20" rx="4" fill="#4a9d6f" />

      {/* Rolling tumbleweed / ball */}
      <circle cx="210" cy="288" r="12" fill="none" stroke="#c9a96e" strokeWidth="2" opacity="0.7" />
      <path d="M200 280 Q210 275 220 280" stroke="#c9a96e" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M198 290 Q210 295 222 290" stroke="#c9a96e" strokeWidth="1.5" fill="none" opacity="0.6" />

      {/* Small critter / character */}
      <ellipse cx="160" cy="292" rx="14" ry="9" fill="#e8d5a0" />
      <circle cx="168" cy="286" r="7" fill="#e8d5a0" />
      <circle cx="170" cy="284" r="2" fill="#333" />
      <path d="M155 292 Q148 298 145 305" stroke="#c9a96e" strokeWidth="2" fill="none" />
      <path d="M165 292 Q162 300 160 306" stroke="#c9a96e" strokeWidth="2" fill="none" />
    </svg>
  );
}

export default function Error404Screen() {
  const router = useRouter();

  return (
    <ErrorPageLayout>
      <div className="w-full max-w-4xl">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Illustration */}
          <div className="w-full md:w-[55%] max-w-sm md:max-w-none">
            <Image src={IMAGES.error[404]} alt="404 Error" width={500} height={400} className="w-full h-auto" />
            
          </div>

          {/* Text content */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            {/* 404 number */}
            <h1 className="text-8xl md:text-9xl font-extrabold text-[#0083FF] leading-none">
              404
            </h1>

            {/* Error badge */}
            <span className="inline-flex items-center bg-yellow-300 text-gray-800 text-sm font-bold px-3 py-1 rounded">
              Error 404!
            </span>

            {/* Message */}
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              The page you are trying to access has incorrect URL or it is
              removed!
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
