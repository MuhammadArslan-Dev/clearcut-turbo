// components/Header.tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useTranslations("Header");

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-700">
          {t("logo")}
        </Link>
        <ul className="hidden md:flex items-center space-x-6">
          <li>
            <Link
              href="#features"
              className="text-gray-600 hover:text-indigo-700 transition"
            >
              {t("features")}
            </Link>
          </li>
          <li>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-indigo-700 transition"
            >
              {t("pricing")}
            </Link>
          </li>
          <li>
            <Link
              href="#contact"
              className="text-gray-600 hover:text-indigo-700 transition"
            >
              {t("contact")}
            </Link>
          </li>
        </ul>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher /> {/* Integrated here */}
          <Link
            href="/login"
            className="text-indigo-700 hover:text-indigo-900 font-medium"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {t("signup")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
