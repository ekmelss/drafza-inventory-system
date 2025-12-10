"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const [user, setUser] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const tokenUser = localStorage.getItem("user"); // stored on login
    setUser(tokenUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const linkClass = (path: string) =>
    pathname === path
      ? "py-4 text-sm font-medium text-red-500 border-b-2 border-red-500"
      : "py-4 text-sm font-medium text-gray-300 hover:text-red-500";

  return (
    <>
      {/* 🔹 Top bar with logo + logout */}
      <header className="bg-black shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/dashboard">
            <img
              src="/Picture1.png"
              alt="D'Rafza Boutique"
              className="h-12 w-auto"
            />
          </Link>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-gray-300 hidden md:inline">
                  Welcome, {user}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg shadow-sm transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-gray-200 text-black rounded-lg shadow-sm transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 🔹 Single navigation bar (includes Types link) */}
      <nav className="bg-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex space-x-8">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link href="/inventory" className={linkClass("/inventory")}>
            Inventory
          </Link>
          <Link href="/types" className={linkClass("/types")}>
            Types
          </Link>
          <Link href="#" className="py-4 text-sm font-medium text-gray-300 hover:text-red-500">
            Sales
          </Link>
          <Link href="#" className="py-4 text-sm font-medium text-gray-300 hover:text-red-500">
            Reports
          </Link>
        </div>
      </nav>
    </>
  );
}