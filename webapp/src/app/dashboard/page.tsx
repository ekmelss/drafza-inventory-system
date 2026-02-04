"use client";

import Header from "../components/header";
import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStockValue: string;
};

type TodaySales = {
  totalRevenue: string;
  totalTransactions: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todaySales, setTodaySales] = useState<TodaySales | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("token");

  async function fetchData() {
    try {
      const token = getToken();
      if (!token) return;

      // Fetch inventory summary
      const summaryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      // Fetch today's sales
      const salesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/reports/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setTodaySales(salesData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{user ? `, ${user.displayName}` : ""}!
          </h1>
          <p className="text-gray-500 mt-1">Here's your inventory overview for today</p>
        </div>

        {/* Inventory Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Inventory Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary?.totalItems || 0}
              </p>
            </div>
            <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-lg shadow p-6 text-white">
              <p className="text-sm opacity-90">Low Stock</p>
              <p className="text-3xl font-bold mt-2">{summary?.lowStockItems || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-red-900 to-black rounded-lg shadow p-6 text-white">
              <p className="text-sm opacity-90">Out of Stock</p>
              <p className="text-3xl font-bold mt-2">{summary?.outOfStockItems || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-lg shadow p-6 text-white">
              <p className="text-sm opacity-90">Stock Value</p>
              <p className="text-3xl font-bold mt-2">
                RM {summary?.totalStockValue || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Today's Sales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                RM {todaySales?.totalRevenue || "0.00"}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {todaySales?.totalTransactions || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/sales">
              <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-lg shadow p-6 text-white hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center">
                  <svg
                    className="w-10 h-10 mr-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold">New Sale</p>
                    <p className="text-sm opacity-90">Create a new transaction</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/inventory">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow p-6 text-white hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center">
                  <svg
                    className="w-10 h-10 mr-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold">Manage Inventory</p>
                    <p className="text-sm opacity-90">Update stock levels</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/reports">
              <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg shadow p-6 text-white hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center">
                  <svg
                    className="w-10 h-10 mr-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold">View Reports</p>
                    <p className="text-sm opacity-90">Sales and analytics</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {summary && (summary.lowStockItems > 0 || summary.outOfStockItems > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Inventory Alerts</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {summary.lowStockItems > 0 && (
                <li>• {summary.lowStockItems} product(s) are running low on stock</li>
              )}
              {summary.outOfStockItems > 0 && (
                <li>• {summary.outOfStockItems} product(s) are out of stock</li>
              )}
            </ul>
            <Link
              href="/inventory"
              className="inline-block mt-3 text-yellow-800 font-semibold hover:underline"
            >
              View Inventory →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}