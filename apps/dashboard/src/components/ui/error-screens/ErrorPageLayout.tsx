"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Mail,
  Youtube,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
} from "lucide-react";

interface ErrorPageLayoutProps {
  children: React.ReactNode;
}

export default function ErrorPageLayout({ children }: ErrorPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5fa]">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 px-6">
        <Link href="/" className="inline-block">
          <Image
            src="/logos/clear_cutoff_logo.png"
            alt="Clear Cutoff"
            width={160}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0083FF] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Contact row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a
              href="tel:9999999999"
              className="flex items-center gap-1.5 hover:text-blue-100 transition-colors"
            >
              <Phone size={13} />
              <span>9999999999</span>
            </a>
            <a
              href="mailto:hi@clearcutoff.in"
              className="flex items-center gap-1.5 hover:text-blue-100 transition-colors"
            >
              <Mail size={13} />
              <span>hi@clearcutoff.in</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 hover:text-blue-100 transition-colors"
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 hover:text-blue-100 transition-colors"
            >
              <Send size={13} />
              <span>Telegram</span>
            </a>
            {/* Social icons */}
            <div className="flex items-center gap-3 ml-auto">
              <a href="#" className="hover:text-blue-100 transition-colors">
                <Youtube size={16} />
              </a>
              <a href="#" className="hover:text-blue-100 transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="hover:text-blue-100 transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="hover:text-blue-100 transition-colors">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-blue-400 text-xs text-blue-100">
            <span>© 2025 Clear Cutoff. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/refund"
                className="hover:text-white transition-colors"
              >
                Refund
              </Link>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
