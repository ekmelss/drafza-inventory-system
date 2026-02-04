"use client";

import Header from "../components/header";
import { useEffect, useState } from "react";

type InventoryItem = {
  _id: string;
  productId: string;
  name: string;
  type: string;
  category: string;
  size: string;
  price: number;
  stock: number;
};

type CartItem = {
  productId: string;
  name: string;
  type: string;
  category: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
};

export default function SalesPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [manualTotal, setManualTotal] = useState<number | "">(0);
  const [adjustMode, setAdjustMode] = useState<"discount" | "total">("discount");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<InventoryItem[]>([]);
  const [showMobileCart, setShowMobileCart] = useState(false);

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
      setInventory(data.filter((item: InventoryItem) => item.stock > 0));
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  const groupedProducts = inventory.reduce((acc, item) => {
    const key = `${item.type}|${item.category}|${item.name}`;
    if (!acc[key]) {
      acc[key] = {
        type: item.type,
        category: item.category,
        name: item.name,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { type: string; category: string; name: string; items: InventoryItem[] }>);

  const filteredProducts = Object.values(groupedProducts).filter((group) =>
    `${group.type} ${group.category} ${group.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const getColor = (name: string) => {
    const parts = name.split(" - ");
    return parts.length > 1 ? parts[1] : name;
  };

  const openSizeModal = (group: typeof groupedProducts[string]) => {
    setAvailableSizes(group.items);
    setShowSizeModal(true);
  };

  const addToCart = (item: InventoryItem) => {
    const existing = cart.find((c) => c.productId === item.productId);
    const color = getColor(item.name);

    if (existing) {
      if (existing.quantity < item.stock) {
        setCart(
          cart.map((c) =>
            c.productId === item.productId ? { ...c, quantity: c.quantity + 1 } : c
          )
        );
      } else {
        alert(`Only ${item.stock} units available in stock`);
      }
    } else {
      setCart([
        ...cart,
        {
          productId: item.productId,
          name: item.name,
          type: item.type,
          category: item.category,
          color,
          size: item.size,
          unitPrice: item.price,
          quantity: 1,
          availableStock: item.stock,
        },
      ]);
    }
    setShowSizeModal(false);
    // Don't auto-open cart - let user decide when to view cart
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.availableStock) {
              alert(`Only ${item.availableStock} units available`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    setSubtotal(newSubtotal);
    
    if (adjustMode === "discount") {
      setManualTotal(newSubtotal - discount);
    } else if (adjustMode === "total" && manualTotal !== "") {
      setDiscount(newSubtotal - Number(manualTotal));
    }
  }, [cart]);

  const handleDiscountChange = (value: number) => {
    setDiscount(value);
    setManualTotal(subtotal - value);
    setAdjustMode("discount");
  };

  const handleTotalChange = (value: number) => {
    setManualTotal(value);
    setDiscount(subtotal - value);
    setAdjustMode("total");
  };

  const finalTotal = manualTotal === "" ? subtotal - discount : Number(manualTotal);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (discount > subtotal) {
      alert("Discount cannot exceed subtotal!");
      return;
    }

    if (!confirm(`Complete sale for RM ${finalTotal.toFixed(2)}?`)) {
      return;
    }

    setLoading(true);

    try {
      const token = getToken();
      if (!token) return;

      const saleData = {
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
        })),
        subtotal,
        discount,
        total: finalTotal,
        paymentMethod,
        notes,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to complete sale");
      }

      const result = await res.json();
      alert(`✅ Sale completed! Sale #${result.sale.saleNumber}`);

      setCart([]);
      setDiscount(0);
      setManualTotal(0);
      setNotes("");
      setPaymentMethod("cash");
      setAdjustMode("discount");
      setShowMobileCart(false);

      fetchInventory();
    } catch (err: any) {
      console.error("Error completing sale:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">New Sale</h1>
          
          {/* Mobile Cart Button */}
          <button
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="lg:hidden relative px-4 py-2 bg-red-700 text-white rounded-lg font-semibold"
          >
            Cart ({cart.length})
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full border rounded-md px-3 sm:px-4 py-2 text-sm sm:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-sm sm:text-base">Available Products</h2>
              </div>

              <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="p-6 text-center text-gray-500 text-sm">No products available</p>
                ) : (
                  <div className="divide-y">
                    {filteredProducts.map((group, idx) => {
                      const color = getColor(group.name);
                      const totalStock = group.items.reduce((sum, item) => sum + item.stock, 0);
                      const sizes = group.items.map((item) => item.size).join(", ");

                      return (
                        <div
                          key={idx}
                          className="p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100"
                        >
                          <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold whitespace-nowrap">
                                  {group.type}
                                </span>
                                <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold whitespace-nowrap">
                                  {group.category}
                                </span>
                              </div>
                              <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{color}</p>
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                Sizes: {sizes}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                Stock: {totalStock}
                              </p>
                            </div>
                            <button
                              onClick={() => openSizeModal(group)}
                              className="shrink-0 px-3 sm:px-4 py-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Cart & Checkout - Desktop */}
          <div className="hidden lg:block space-y-4">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <h2 className="font-semibold mb-4 flex justify-between items-center">
                <span>Cart</span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                )}
              </h2>

              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="border-2 border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold">
                                {item.type}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                                {item.category}
                              </span>
                            </div>
                            <p className="font-bold text-gray-900 text-sm truncate">{item.color}</p>
                            <p className="text-xs text-gray-600">
                              Size: <span className="font-semibold">{item.size}</span>
                              {(item.size === "2XL" || item.size === "3XL") && (
                                <span className="text-red-600 ml-1">(+RM10)</span>
                              )}
                            </p>
                            <p className="text-sm text-red-700 font-semibold">
                              RM {item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-800 text-xl ml-2"
                          >
                            ×
                          </button>
                        </div>

                        <div className="flex items-center justify-between border-t pt-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="w-8 h-8 border-2 border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100 font-bold"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="w-8 h-8 border-2 border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-bold text-lg">
                            RM {(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Section */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-base border-b pb-2">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-bold text-lg">RM {subtotal.toFixed(2)}</span>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-3">
                        <p className="text-xs text-yellow-800 font-semibold">💡 Adjust discount OR final total:</p>
                        
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Discount:</label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">RM</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={subtotal}
                              value={discount}
                              onChange={(e) => handleDiscountChange(Number(e.target.value))}
                              className="w-24 border-2 border-gray-300 rounded-md px-2 py-1 text-sm text-right font-semibold"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Final Total:</label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">RM</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={manualTotal}
                              onChange={(e) => handleTotalChange(Number(e.target.value))}
                              className="w-24 border-2 border-red-300 rounded-md px-2 py-1 text-sm text-right font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t-2 pt-3 flex justify-between text-xl font-bold">
                        <span>TOTAL:</span>
                        <span className="text-red-700">RM {finalTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online Transfer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Customer notes..."
                      />
                    </div>

                    <button
                      onClick={handleCompleteSale}
                      disabled={loading}
                      className="w-full bg-red-700 hover:bg-red-600 text-white py-3 rounded-md font-bold text-lg disabled:bg-gray-400"
                    >
                      {loading ? "Processing..." : "Complete Sale"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Cart Drawer */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg">Cart ({cart.length})</h2>
              <div className="flex gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-sm text-red-600 font-semibold"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowMobileCart(false)}
                  className="text-2xl text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Cart is empty</p>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="border-2 border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold">
                              {item.type}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                              {item.category}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">{item.color}</p>
                          <p className="text-sm text-gray-600">
                            Size: {item.size}
                            {(item.size === "2XL" || item.size === "3XL") && (
                              <span className="text-red-600 ml-1">(+RM10)</span>
                            )}
                          </p>
                          <p className="text-sm text-red-700 font-semibold">
                            RM {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 text-2xl ml-2"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t pt-2">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-10 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center active:bg-gray-100 font-bold text-lg"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-bold text-xl">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-10 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center active:bg-gray-100 font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-xl">
                          RM {(item.unitPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t bg-gray-50 space-y-3">
                  <div className="flex justify-between text-base border-b pb-2">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-bold text-lg">RM {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Discount:</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">RM</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={subtotal}
                          value={discount}
                          onChange={(e) => handleDiscountChange(Number(e.target.value))}
                          className="w-24 border-2 border-gray-300 rounded-md px-2 py-2 text-sm text-right font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Final Total:</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">RM</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={manualTotal}
                          onChange={(e) => handleTotalChange(Number(e.target.value))}
                          className="w-24 border-2 border-red-300 rounded-md px-2 py-2 text-sm text-right font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 pt-3 flex justify-between text-xl font-bold">
                    <span>TOTAL:</span>
                    <span className="text-red-700">RM {finalTotal.toFixed(2)}</span>
                  </div>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border-2 rounded-md px-3 py-2 text-sm font-medium"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>

                  <button
                    onClick={handleCompleteSale}
                    disabled={loading}
                    className="w-full bg-red-700 active:bg-red-800 text-white py-4 rounded-lg font-bold text-lg disabled:bg-gray-400"
                  >
                    {loading ? "Processing..." : "Complete Sale"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Size Selection Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-red-700 text-white">
              <h3 className="text-base sm:text-lg font-semibold">Select Size</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-2">
                {availableSizes.map((item) => (
                  <button
                    key={item.productId}
                    onClick={() => addToCart(item)}
                    className="w-full border-2 border-gray-200 hover:border-red-500 active:bg-red-50 rounded-lg p-3 sm:p-4 text-left transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-base sm:text-lg">
                          Size {item.size}
                          {(item.size === "2XL" || item.size === "3XL") && (
                            <span className="text-red-600 ml-2 text-sm">(+RM10)</span>
                          )}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">Stock: {item.stock} units</p>
                        <p className="text-red-700 font-semibold text-sm sm:text-base">RM {item.price.toFixed(2)}</p>
                      </div>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => setShowSizeModal(false)}
                className="w-full px-4 py-3 bg-gray-200 text-black rounded-md font-semibold active:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}