"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      
      if (userStr && userStr !== "undefined" && userStr !== "null") {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const linkClass = (path: string) =>
    pathname === path
      ? "py-4 px-3 text-sm font-medium text-red-500 border-b-2 border-red-500 whitespace-nowrap"
      : "py-4 px-3 text-sm font-medium text-gray-300 hover:text-red-500 whitespace-nowrap";

  return (
    <>
      {/* Top bar with logo + user info */}
      <header className="bg-black shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-14 sm:h-16">
          <Link href="/dashboard" className="shrink-0">
            <img
              src="/Picture1.png"
              alt="D'Rafza Boutique"
              className="h-10 sm:h-12 w-auto"
            />
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-gray-300 text-sm font-medium">
                  {user.displayName || user.username}
                </span>
                <span className="text-gray-500 text-xs">
                  {user.username}
                </span>
              </div>
            ) : (
              <span className="text-gray-400 text-xs sm:text-sm">Not logged in</span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg shadow-sm transition text-xs sm:text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation bar - SCROLLABLE ON MOBILE */}
      <nav className="bg-black shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-2 sm:space-x-8 min-w-max">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link href="/inventory" className={linkClass("/inventory")}>
            Inventory
          </Link>
          <Link href="/types" className={linkClass("/types")}>
            Types
          </Link>
          <Link href="/sales" className={linkClass("/sales")}>
            Sales
          </Link>
          <Link href="/reports" className={linkClass("/reports")}>
            Reports
          </Link>
        </div>
      </nav>
    </>
  );
}