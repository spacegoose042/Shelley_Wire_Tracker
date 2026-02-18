"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin/parts", label: "Parts" },
  { href: "/admin/receive", label: "Receive inventory" },
  { href: "/admin/receipts", label: "Receipt history" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/users", label: "Users" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
      {adminLinks.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname === href || pathname.startsWith(href + "/")
              ? "bg-shelley-blue text-white"
              : "bg-shelley-gray-light/60 text-shelley-gray hover:bg-shelley-gray-light hover:text-shelley-blue"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
