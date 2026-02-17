"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [logoError, setLogoError] = useState(false);

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pull", label: "Record pull" },
    { href: "/my-pulls", label: "My pulls" },
    ...(isAdmin ? [{ href: "/admin/parts", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          {logoError ? (
            <span className="text-lg font-bold text-shelley-blue">Shelley Electric</span>
          ) : (
            <Image
              src="/logo.png"
              alt="Shelley Electric"
              width={180}
              height={48}
              className="h-10 w-auto object-contain"
              unoptimized
              onError={() => setLogoError(true)}
            />
          )}
          <span className="hidden text-sm font-medium text-shelley-blue sm:inline">
            Wire Tracker
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === href
                  ? "bg-shelley-blue text-white"
                  : "text-shelley-gray hover:bg-shelley-gray-light hover:text-shelley-blue"
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-shelley-gray hover:bg-shelley-gray-light hover:text-shelley-red"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
