"use client";

import Header from "../components/header"; // adjust path if needed
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outStock: 0,
    totalSales: 0,
  });

  useEffect(() => {
    // TEMP: dummy data; later you can fetch from your backend
    setStats({
      totalProducts: 120,
      lowStock: 8,
      outStock: 3,
      totalSales: 5230.5,
    });
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Quick Stats
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow text-white p-5">
            <p className="text-sm">Total Products</p>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow text-white p-5">
            <p className="text-sm">Low Stock</p>
            <p className="text-2xl font-bold">{stats.lowStock}</p>
          </div>

          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow text-white p-5">
            <p className="text-sm">Out of Stock</p>
            <p className="text-2xl font-bold">{stats.outStock}</p>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow text-white p-5">
            <p className="text-sm">Total Sales</p>
            <p className="text-2xl font-bold">
              RM{" "}
              {stats.totalSales.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
