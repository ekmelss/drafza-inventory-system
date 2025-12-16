"use client";
console.log("✅ API URL:", process.env.NEXT_PUBLIC_API_URL);
import Header from "../components/header";
import React, { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  size: string;
  stock: number;
  lowStockThreshold?: number;
};

type ProductType = { id: string | number; type: string };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // form fields
  const [formTypeChoice, setFormTypeChoice] = useState<string>("");
  const [formTarget, setFormTarget] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formStock, setFormStock] = useState<number | "">("");
  const [formPrice, setFormPrice] = useState<number | "">("");
  const [formNewType, setFormNewType] = useState(""); 

  const kidsSizes = ["0", "1", "2", "4", "6", "8", "10", "12"];
  const adultSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  // which groups are expanded (key = category)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  async function fetchProducts() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Please login again.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 include token
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
    }
  }

  async function fetchTypes() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Please login again.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/types`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 include token
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch types (${res.status})`);
      const data = await res.json();
      setTypes(data);
    } catch (err) {
      console.error("❌ Failed to fetch types:", err);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchTypes();
  }, []);

  useEffect(() => {
  const refreshTypes = () => fetchTypes();

  window.addEventListener("storage", refreshTypes);
  return () => window.removeEventListener("storage", refreshTypes);
}, []);

  // Derived stats
  const totalItems = products.length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).length;
  const outStock = products.filter((p) => p.stock === 0).length;

  // Group products by category
  const grouped = useMemo(() => {
    const g: Record<string, Product[]> = {};
    products.forEach((p) => {
      const key = p.category;
      if (!g[key]) g[key] = [];
      g[key].push(p);
    });
    return g;
  }, [products]);

  // Search filter (search in name, category, size)
  const filteredProductIds = useMemo(() => {
    if (!search.trim()) return new Set(products.map((p) => p.id));
    const q = search.toLowerCase();
    return new Set(
      products.filter((p) =>
        `${p.name} ${p.category} ${p.size}`.toLowerCase().includes(q)
      ).map((p) => p.id)
    );
  }, [search, products]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const o: Record<string, boolean> = {};
    Object.keys(grouped).forEach((k) => (o[k] = true));
    setExpandedGroups(o);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  // Add product handler (merges your products.php logic)
  // ✅ Add product handler (connected to backend API)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate required fields
    if (
      formTypeChoice === "" ||
      formTarget === "" ||
      formSize === "" ||
      formColor === "" ||
      formStock === "" ||
      formPrice === ""
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const typeValue = formTypeChoice;

    // ✅ Create product object for backend
    const newProduct = {
      name: `${typeValue} - ${formColor}`,         // Example: "Baju Kurung - Red"
      category: formTarget, // Just "Adult" or "Kids"
      size: formSize,
      stock: Number(formStock),
      price: Number(formPrice),
      lowStockThreshold: 5,                        // You can make this dynamic later
    };

    try {
      const token = localStorage.getItem("token"); // ✅ get token from localStorage
      if (!token) {
        alert("You are not logged in. Please login again.");
        return;
      }

      // ✅ Use direct API URL and attach token
      const res = await fetch(`http://localhost:5001/api/inventory/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 this fixes the 401 Unauthorized
        },
        body: JSON.stringify(newProduct),
      });

      if (!res.ok) throw new Error("Failed to add product");

      const saved = await res.json();

      setProducts((prev) => [...prev, saved.item]);     
      console.log("✅ Product added:", saved);

      // ✅ Reset modal form
      setFormTypeChoice("");
      setFormNewType("");
      setFormTarget("");
      setFormSize("");
      setFormColor("");
      setFormStock("");
      setFormPrice("");
      setShowAddModal(false);
    } catch (err) {
      console.error("❌ Add product failed:", err);
      alert("Error adding product. Check console.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-black to-gray-800 rounded-lg shadow text-white p-5">
            <p className="text-sm">Total Items</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
          <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-lg shadow text-white p-5">
            <p className="text-sm">Low Stock</p>
            <p className="text-2xl font-bold">{lowStock}</p>
          </div>
          <div className="bg-gradient-to-r from-red-900 to-black rounded-lg shadow text-white p-5">
            <p className="text-sm">Out of Stock</p>
            <p className="text-2xl font-bold">{outStock}</p>
          </div>
        </div>

        {/* Table area */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Current Inventory</h2>

            <div className="flex space-x-2">
              <input
                type="text"
                id="searchInput"
                placeholder="Search..."
                className="border rounded-md px-3 py-1 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={expandAll} className="px-3 py-1 bg-gray-200 text-sm rounded-md">Expand All</button>
              <button onClick={collapseAll} className="px-3 py-1 bg-gray-200 text-sm rounded-md">Collapse All</button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-sm rounded-md shadow-sm"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"></path>
                </svg>
                Add
              </button>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Size</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Stock</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {Object.entries(grouped).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No products yet.</td>
                </tr>
              )}

              {Object.entries(grouped).map(([groupName, items]) => {
                // only show rows that match search
                const visibleItems = items.filter((it) => filteredProductIds.has(it.id));
                const isExpanded = !!expandedGroups[groupName];
                return (
                  <React.Fragment key={groupName}>
                    <tr className="bg-gray-200 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                      <td colSpan={4} className="px-6 py-2 font-semibold text-gray-900 flex items-center">
                        <span className="mr-2">{isExpanded ? "▼" : "▶"}</span>
                        {groupName}
                      </td>
                    </tr>

                    {isExpanded && visibleItems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-3 text-gray-500">No matching items.</td>
                      </tr>
                    )}

                    {isExpanded && visibleItems.map((p, idx) => (
                        <tr key={p.id || idx} className="product-row">
                            <td className="px-6 py-3">{p.name || "—"}</td>
                            <td className="px-6 py-3">{p.category || "—"}</td>
                            <td className="px-6 py-3">{p.size || "—"}</td>
                            <td className="px-6 py-3">{p.stock ?? "—"}</td>
                        </tr>
                    ))}

                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add New Item</h3>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input required className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Product name" value={formColor} onChange={(e)=>setFormColor(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Name appears as "type - color" in the table.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formTypeChoice}
                  onChange={(e) => setFormTypeChoice(e.target.value)}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">-- Select Type --</option>
                  {types.map((t) => (
                    <option key={t.id || t.type} value={t.type}>
                        {t.type}
                     </option>
                    ))}

                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select value={formTarget} onChange={(e)=>setFormTarget(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" required>
                  <option value="">Select category</option>
                  <option value="Adult">Adult</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <select value={formSize} onChange={(e)=>setFormSize(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" required>
                  <option value="">Select size</option>
                  {(formTarget === "Kids" ? kidsSizes : formTarget === "Adult" ? adultSizes : []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input type="number" step="0.01" value={formPrice} onChange={(e)=>setFormPrice(Number(e.target.value))} className="mt-1 w-full border rounded-md px-3 py-2" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" value={formStock} onChange={(e)=>setFormStock(Number(e.target.value))} className="mt-1 w-full border rounded-md px-3 py-2" required />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-black rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
