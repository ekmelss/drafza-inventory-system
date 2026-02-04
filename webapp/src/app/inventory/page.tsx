"use client";

import Header from "../components/header";
import React, { useEffect, useMemo, useState } from "react";

type InventoryItem = {
  _id: string;
  productId: string;
  name: string;
  type: string;
  category: string;
  size: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  location: string;
};

type ProductType = { _id: string; type: string };

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const [formType, setFormType] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formPrice, setFormPrice] = useState<number | "">("");
  const [formStock, setFormStock] = useState<number | "">("");

  const [editStock, setEditStock] = useState<number | "">("");

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const kidsSizes = ["0", "1", "2", "4", "6", "8", "10", "12"];
  const adultSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  const getToken = () => localStorage.getItem("token");

  async function fetchInventory() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }

  async function fetchTypes() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/types/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch types");
      const data = await res.json();
      setTypes(data);
    } catch (err) {
      console.error("Error fetching types:", err);
    }
  }

  useEffect(() => {
    fetchInventory();
    fetchTypes();
  }, []);

  const totalItems = inventory.length;
  const lowStock = inventory.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
  const outStock = inventory.filter((i) => i.stock === 0).length;

  // Group by Type - Category (e.g., "Baju Kurung - Adult")
  const grouped = useMemo(() => {
    const g: Record<string, InventoryItem[]> = {};
    inventory.forEach((item) => {
      const key = `${item.type} - ${item.category}`;
      if (!g[key]) g[key] = [];
      g[key].push(item);
    });
    return g;
  }, [inventory]);

  const filteredIds = useMemo(() => {
    if (!search.trim()) return new Set(inventory.map((i) => i._id));
    const q = search.toLowerCase();
    return new Set(
      inventory.filter((i) =>
        `${i.name} ${i.type} ${i.category} ${i.size}`.toLowerCase().includes(q)
      ).map((i) => i._id)
    );
  }, [search, inventory]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const o: Record<string, boolean> = {};
    Object.keys(grouped).forEach((k) => (o[k] = true));
    setExpandedGroups(o);
  };

  const collapseAll = () => setExpandedGroups({});

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formType || !formColor || !formCategory || !formSize || formPrice === "" || formStock === "") {
      alert("Please fill in all fields");
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      // Calculate price with size adjustment
      let finalPrice = Number(formPrice);
      if (formSize === "2XL" || formSize === "3XL") {
        finalPrice += 10; // +RM10 for plus sizes
      }

      const newProduct = {
        name: `${formType} - ${formColor}`,
        type: formType,
        category: formCategory,
        size: formSize,
        price: finalPrice,
        lowStockThreshold: 5,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProduct),
      });

      if (!res.ok) throw new Error("Failed to add product");

      const data = await res.json();
      const productId = data.product._id;

      const stockRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: Number(formStock) }),
      });

      if (!stockRes.ok) throw new Error("Failed to update stock");

      setFormType("");
      setFormColor("");
      setFormCategory("");
      setFormSize("");
      setFormPrice("");
      setFormStock("");
      setShowAddModal(false);

      fetchInventory();
      alert("Product added successfully!");
    } catch (err: any) {
      console.error("Error adding product:", err);
      alert(err.message);
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditStock(item.stock);
    setShowEditModal(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || editStock === "") return;

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${editingItem.productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: Number(editStock) }),
      });

      if (!res.ok) throw new Error("Failed to update stock");

      setShowEditModal(false);
      setEditingItem(null);
      fetchInventory();
      alert("Stock updated successfully!");
    } catch (err: any) {
      console.error("Error updating stock:", err);
      alert(err.message);
    }
  };

  const openDeleteModal = (item: InventoryItem) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingItem) return;

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${deletingItem.productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete product");

      setShowDeleteModal(false);
      setDeletingItem(null);
      fetchInventory();
      alert("Product deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting product:", err);
      alert(err.message);
    }
  };

  // Extract color from name (assumes format: "Type - Color")
  const getColorFromName = (name: string) => {
    const parts = name.split(" - ");
    return parts.length > 1 ? parts[1] : name;
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Current Inventory</h2>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search..."
                className="border rounded-md px-3 py-1 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={expandAll} className="px-3 py-1 bg-gray-200 text-sm rounded-md">
                Expand All
              </button>
              <button onClick={collapseAll} className="px-3 py-1 bg-gray-200 text-sm rounded-md">
                Collapse All
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-sm rounded-md"
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Price</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {Object.entries(grouped).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No products yet. Add your first product!
                  </td>
                </tr>
              )}

              {Object.entries(grouped).map(([groupName, items]) => {
                const visibleItems = items.filter((it) => filteredIds.has(it._id));
                const isExpanded = !!expandedGroups[groupName];

                return (
                  <React.Fragment key={groupName}>
                    <tr className="bg-gradient-to-r from-amber-100 to-amber-50 cursor-pointer hover:from-amber-200 hover:to-amber-100" onClick={() => toggleGroup(groupName)}>
                      <td colSpan={6} className="px-6 py-3 font-bold text-gray-900 flex items-center">
                        <span className="mr-2 text-amber-700">{isExpanded ? "▼" : "▶"}</span>
                        <span className="text-lg">{groupName}</span>
                        <span className="ml-3 text-sm text-gray-600">({visibleItems.length} items)</span>
                      </td>
                    </tr>

                    {isExpanded &&
                      visibleItems.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <div className="font-medium text-gray-900">{getColorFromName(item.name)}</div>
                            <div className="text-xs text-gray-500">{item.type}</div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">{item.category}</td>
                          <td className="px-6 py-3">
                            <span className="inline-block px-2 py-1 bg-gray-200 rounded text-sm font-semibold">
                              {item.size}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={
                                item.stock === 0
                                  ? "text-red-600 font-bold text-lg"
                                  : item.stock <= item.lowStockThreshold
                                  ? "text-orange-600 font-semibold text-lg"
                                  : "text-green-600 font-semibold text-lg"
                              }
                            >
                              {item.stock}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-semibold text-gray-900">RM {item.price.toFixed(2)}</td>
                          <td className="px-6 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit Stock
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
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
            <div className="px-6 py-4 border-b bg-red-700 text-white">
              <h3 className="text-lg font-semibold">Add New Product</h3>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color/Name *</label>
                <input
                  required
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Navy Blue, Emerald Green"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">-- Select Type --</option>
                  {types.map((t) => (
                    <option key={t._id} value={t.type}>
                      {t.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Adult">Adult</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Size *</label>
                <select
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select size</option>
                  {(formCategory === "Kids" ? kidsSizes : formCategory === "Adult" ? adultSizes : []).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s} {(s === "2XL" || s === "3XL") && "(+RM10)"}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Base Price (RM) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: 2XL & 3XL will automatically add +RM10
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Stock *</label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-black rounded-md"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b bg-blue-700 text-white">
              <h3 className="text-lg font-semibold">Update Stock</h3>
              <p className="text-sm mt-1">{editingItem.name} ({editingItem.size})</p>
            </div>

            <form onSubmit={handleUpdateStock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                <p className="text-3xl font-bold text-gray-900 mt-1">{editingItem.stock}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Stock</label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-lg font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 text-black rounded-md"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b bg-red-700 text-white">
              <h3 className="text-lg font-semibold">⚠️ Delete Product</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-900 mb-4">
                Are you sure you want to delete this product?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-semibold text-gray-900">{deletingItem.name}</p>
                <p className="text-sm text-gray-600">Size: {deletingItem.size}</p>
                <p className="text-sm text-gray-600">Current Stock: {deletingItem.stock}</p>
              </div>
              <p className="text-sm text-red-600">
                This action cannot be undone. The product will be deleted from all locations.
              </p>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-black rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}