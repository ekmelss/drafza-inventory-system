"use client";

import { useEffect, useState } from "react";

interface Item {
  _id: string;
  name: string;
  category: string;
  size: string;
  stock: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    size: "",
    stock: "",
    new_type: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Fetch items and types
  useEffect(() => {
    fetchItems();
    fetchTypes();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Fetched items:", data);
      if (!res.ok) throw new Error(data.error || "Failed to fetch items");
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const fetchTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/inventory/types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch types");
      setTypes(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // use new_type if category is "other"
      const category =
        form.category === "other" ? form.new_type : form.category;

      const res = await fetch("http://localhost:5000/api/inventory/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          category,
          size: form.size,
          stock: Number(form.stock),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");

      await fetchItems(); // refresh
      setForm({ name: "", category: "", size: "", stock: "", new_type: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Inventory</h2>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Item name"
          className="border p-2 rounded w-full"
          required
        />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">Select Category</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value="other">Other (Add New)</option>
        </select>

        {form.category === "other" && (
          <input
            type="text"
            name="new_type"
            value={form.new_type}
            onChange={handleChange}
            placeholder="New category"
            className="border p-2 rounded w-full"
          />
        )}

        <select
          name="size"
          value={form.size}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">Select Size</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>

        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          placeholder="Stock quantity"
          className="border p-2 rounded w-full"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add Item"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <table className="w-full border-collapse border">
        <thead>
            <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Size</th>
            <th className="border p-2">Stock</th>
            </tr>
        </thead>
        <tbody>
            {items.map((item, idx) => (
            <tr key={item._id || idx}>
            <td className="border p-2">{item.name || "—"}</td>
            <td className="border p-2">{item.category || "—"}</td>
            <td className="border p-2">{item.size || "—"}</td>
            <td className="border p-2">{item.stock ?? "—"}</td>
            </tr>
            ))}
        </tbody>
    </table>
    </div>
  );
}
