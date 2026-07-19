"use client";

import { useState } from "react";
import Link from "next/link";

type Item = {
  name: string;
  href?: string;
  items?: Item[];
};

function CategoryItem({ item, parentKey }: { item: Item; parentKey: string }) {
  const [open, setOpen] = useState<string | null>(null);

  if (item.items) {
    return (
      <li>
        <button
          onClick={() => setOpen(open === item.name ? null : item.name)}
          className="flex w-full items-center justify-between rounded px-3 py-2 text-left font-medium hover:bg-gray-200"
        >
          {item.name}
          <span>{open === item.name ? "▾" : "▸"}</span>
        </button>

        {open === item.name && (
          <ul className="ml-4 mt-1 space-y-1 border-l border-gray-300 pl-2">
            {item.items.map((child, idx) => (
              <CategoryItem
                key={idx}
                item={child}
                parentKey={parentKey + "-" + item.name}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href || "#"}
        className="block rounded px-3 py-1 text-sm hover:bg-blue-100"
      >
        {item.name}
      </Link>
    </li>
  );
}

export default function LeftSidebar() {

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-white border-white p-4 fixed top-[64px] bottom-[48px] overflow-y-auto">
      <ul className="space-y-2">
       
      </ul>
    </aside>
  );
}
