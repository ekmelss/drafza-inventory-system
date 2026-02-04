"use client";
import React, { useEffect, useState } from "react";
import Header from "../components/header";

type ProductType = { _id: string; type: string };

export default function ManageTypesPage() {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("token");

  // Fetch all types
  async function fetchTypes() {
    try {
      const token = getToken();
      if (!token) {
        alert("You are not logged in. Please login again.");
        return;
      }

      // Updated endpoint: /api/products/types/list
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/types/list`, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (!res.ok) throw new Error("Failed to fetch types");
      const data = await res.json();
      setTypes(data);
    } catch (err) {
      console.error("❌ Fetch types failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // Add new type
  async function handleAddType(e: React.FormEvent) {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    try {
      const token = getToken();
      if (!token) {
        alert("You are not logged in. Please login again.");
        return;
      }

      // Updated endpoint: /api/products/types/add
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/types/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: newTypeName.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to add type");
        return;
      }

      const { type: saved } = await res.json();
      setTypes((prev) => [...prev, saved]);
      setNewTypeName("");

      alert("Type added successfully!");
    } catch (err) {
      console.error("❌ Add type failed:", err);
      alert("Error adding type. Check console.");
    }
  }

  // Delete type
  async function handleDeleteType(id: string) {
    if (!confirm("Delete this type?")) return;

    try {
      const token = getToken();
      if (!token) {
        alert("You are not logged in. Please login again.");
        return;
      }

      // Updated endpoint: /api/products/types/:id
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/types/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete type");
      setTypes((prev) => prev.filter((t) => t._id !== id));

      alert("Type deleted successfully!");
    } catch (err) {
      console.error("❌ Delete type failed:", err);
      alert("Error deleting type. Check console.");
    }
  }

  useEffect(() => {
    fetchTypes();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">
          Manage Product Types
        </h1>

        <form onSubmit={handleAddType} className="flex space-x-3 mb-6">
          <input
            type="text"
            className="border rounded-md px-3 py-2 flex-1"
            placeholder="Enter new type name (e.g. Baju Kurung, Jubah, Telekung)"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded-md"
          >
            Add Type
          </button>
        </form>

        {loading ? (
          <p className="text-gray-500">Loading types...</p>
        ) : types.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No types added yet.</p>
            <p className="text-sm text-gray-400">
              Add your first product type above (e.g., "Baju Kurung", "Jubah", "Telekung")
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
            {types.map((t) => (
              <li
                key={t._id}
                className="flex justify-between items-center px-6 py-4 hover:bg-gray-50"
              >
                <span className="text-gray-800 font-medium">{t.type}</span>
                <button
                  onClick={() => handleDeleteType(t._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}