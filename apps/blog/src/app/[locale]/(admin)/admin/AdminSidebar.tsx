"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// First real tab in the admin area (previously just a placeholder page) —
// add new admin sections here as they're built.
const NAV_ITEMS = [{ label: "Daily-Tests", href: "/admin/daily-tests" }];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
      <div className="mb-6 px-2 text-lg font-semibold">Admin</div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.includes(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
