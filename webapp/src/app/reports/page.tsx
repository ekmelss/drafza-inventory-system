"use client";

import Header from "../components/header";
import { useEffect, useState, useRef } from "react";

type Sale = {
  _id: string;
  saleNumber: string;
  items: Array<{
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  soldBy: string;
};

// Helper: Get shortcode for product type
function getTypeShortcode(fullName: string): string {
  const typeName = fullName.split(" - ")[0] || fullName;
  
  const shortcodes: Record<string, string> = {
    "Baju Kurung": "BK",
    "Baju Melayu": "BM",
    "Kurta": "KT",
    "Baju Kebarung": "KB",
    "Samping": "SP",
  };
  
  return shortcodes[typeName] || typeName.substring(0, 2).toUpperCase();
}

// Helper: Get category shortcode
function getCategoryShortcode(name: string): string {
  if (name.toLowerCase().includes("adult")) return "A";
  if (name.toLowerCase().includes("kids")) return "K";
  return name.substring(0, 1).toUpperCase();
}

// Helper: Get color from product name
function getColor(fullName: string): string {
  const parts = fullName.split(" - ");
  return parts.length > 1 ? parts[1] : fullName;
}

// Helper: Get payment method shortcode
function getPaymentShortcode(method: string): string {
  const upper = method.toUpperCase();
  if (upper === "CASH") return "CASH";
  if (upper === "CARD") return "CARD";
  if (upper === "ONLINE") return "QR";
  return upper;
}

// Print Component - NEW FORMAT: Per-Sale Listing
const PrintDailySales = ({ sales, user, date }: { sales: Sale[]; user: any; date: string }) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
  const totalItems = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const paymentBreakdown = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="print-container p-8 bg-white text-black" style={{ fontFamily: 'monospace' }}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
        .print-container {
          font-size: 11px;
          line-height: 1.4;
        }
        .print-header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .print-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .print-subtitle {
          font-size: 12px;
        }
        .sale-entry {
          margin-bottom: 12px;
          page-break-inside: avoid;
          border-left: 3px solid #000;
          padding-left: 10px;
        }
        .sale-header {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sale-items {
          margin-left: 15px;
          margin-bottom: 4px;
        }
        .sale-item {
          padding: 2px 0;
        }
        .sale-total {
          font-weight: bold;
          margin-left: 15px;
          border-top: 1px solid #333;
          padding-top: 4px;
          display: flex;
          justify-content: space-between;
        }
        .payment-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #f0f0f0;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
        }
        .print-summary {
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-top: 15px;
          page-break-inside: avoid;
        }
        .print-total-row {
          font-weight: bold;
          font-size: 13px;
        }
      `}</style>

      {/* Header */}
      <div className="print-header">
        <div className="print-title">D'RAFZA - {user?.displayName || user?.username}</div>
        <div className="print-subtitle">Daily Sales Report - {date}</div>
      </div>

      {/* Sales listed per transaction */}
      <div style={{ marginBottom: '20px' }}>
        {sales.map((sale, idx) => (
          <div key={sale._id} className="sale-entry">
            <div className="sale-header">
              <span>
                {idx + 1}. Sale #{sale.saleNumber.split('-').slice(-1)[0]}
              </span>
              <span className="payment-badge">
                {getPaymentShortcode(sale.paymentMethod)}
              </span>
            </div>
            
            <div className="sale-items">
              {sale.items.map((item, itemIdx) => {
                const type = getTypeShortcode(item.productName);
                const category = getCategoryShortcode(item.productName);
                const color = getColor(item.productName);
                
                return (
                  <div key={itemIdx} className="sale-item">
                    {type}/{category} - {color} - Size {item.size} - Qty {item.quantity} - RM {item.unitPrice.toFixed(2)} = RM {item.subtotal.toFixed(2)}
                  </div>
                );
              })}
            </div>
            
            <div className="sale-total">
              <span>SUBTOTAL:</span>
              <span>RM {sale.subtotal.toFixed(2)}</span>
            </div>
            
            {sale.discount > 0 && (
              <div className="sale-total" style={{ color: '#c00' }}>
                <span>DISCOUNT:</span>
                <span>- RM {sale.discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="sale-total" style={{ fontSize: '13px', marginTop: '4px' }}>
              <span>TOTAL:</span>
              <span>RM {sale.total.toFixed(2)}</span>
            </div>
            
            {sale.notes && (
              <div style={{ marginLeft: '15px', marginTop: '4px', fontSize: '10px', fontStyle: 'italic', color: '#666' }}>
                Note: {sale.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="print-summary">
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL SALES:</td>
              <td style={{ textAlign: 'right', width: '100px' }}>
                {sales.length} transactions
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL ITEMS SOLD:</td>
              <td style={{ textAlign: 'right' }}>{totalItems} items</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL DISCOUNT:</td>
              <td style={{ textAlign: 'right' }}>RM {totalDiscount.toFixed(2)}</td>
            </tr>
            <tr className="print-total-row">
              <td style={{ textAlign: 'right', paddingRight: '10px', borderTop: '2px solid #000', paddingTop: '5px' }}>
                TOTAL REVENUE:
              </td>
              <td style={{ textAlign: 'right', borderTop: '2px solid #000', paddingTop: '5px' }}>
                RM {totalRevenue.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
          <div>
            <strong>Payment Methods:</strong>{' '}
            {Object.entries(paymentBreakdown).map(([method, count]) => 
              `${getPaymentShortcode(method)} (${count})`
            ).join(', ')}
          </div>
        </div>

        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
          <span>Staff: {user?.username}</span>
          <span>Printed: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '20px', fontSize: '10px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <strong>Legend:</strong> BK=Baju Kurung, BM=Baju Melayu, KT=Kurta, KB=Baju Kebarung, SP=Samping | A=Adult, K=Kids | QR=Online Transfer
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [user, setUser] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);

  const getToken = () => localStorage.getItem("token");

  async function fetchSales() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/sales?limit=100`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch sales");
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodaySales() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/reports/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch today's sales");
      const data = await res.json();
      setTodaySales(data.sales || []);
    } catch (err) {
      console.error("Error fetching today's sales:", err);
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      setUser(JSON.parse(userStr));
    }
    fetchSales();
    fetchTodaySales();
  }, []);

  const handlePrint = () => {
    const printContent = componentRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Daily Sales Report</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
  const totalItems = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const toggleSaleDetails = (saleId: string) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  const todayDate = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Sales Reports</h1>
          
          {/* Print Today's Sales Button */}
          {todaySales.length > 0 && (
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Today's Sales
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Total Sales</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalSales}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">RM {totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Total Discounts</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">RM {totalDiscount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Items Sold</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalItems}</p>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={fetchSales}
              disabled={loading}
              className="px-4 sm:px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md disabled:bg-gray-400 font-semibold text-sm"
            >
              {loading ? "Loading..." : "Filter"}
            </button>
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                fetchSales();
              }}
              className="px-4 sm:px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-semibold text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-sm sm:text-base">Sales History</h2>
          </div>

          {sales.length === 0 ? (
            <p className="p-6 text-center text-gray-500 text-sm">No sales found for selected period</p>
          ) : (
            <div className="divide-y">
              {sales.map((sale) => {
                const isExpanded = expandedSale === sale._id;
                return (
                  <div key={sale._id}>
                    <div
                      className="p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                      onClick={() => toggleSaleDetails(sale._id)}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base">
                            {isExpanded ? "▼" : "▶"} {sale.saleNumber}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {new Date(sale.createdAt).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{sale.soldBy}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {sale.paymentMethod.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-base sm:text-lg text-red-700">
                            RM {sale.total.toFixed(2)}
                          </p>
                          {sale.discount > 0 && (
                            <p className="text-xs text-gray-500">
                              Disc: RM {sale.discount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-gray-50">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm">
                            <thead className="border-b">
                              <tr className="text-left">
                                <th className="py-2 pr-2">Product</th>
                                <th className="py-2 px-2">Size</th>
                                <th className="py-2 px-2 text-right">Qty</th>
                                <th className="py-2 px-2 text-right">Price</th>
                                <th className="py-2 pl-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item, idx) => (
                                <tr key={idx} className="border-b">
                                  <td className="py-2 pr-2">{item.productName}</td>
                                  <td className="py-2 px-2">{item.size}</td>
                                  <td className="py-2 px-2 text-right">{item.quantity}</td>
                                  <td className="py-2 px-2 text-right">RM {item.unitPrice.toFixed(2)}</td>
                                  <td className="py-2 pl-2 text-right">RM {item.subtotal.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="font-semibold">
                              <tr>
                                <td colSpan={4} className="py-2 text-right pr-2">
                                  Subtotal:
                                </td>
                                <td className="py-2 text-right">RM {sale.subtotal.toFixed(2)}</td>
                              </tr>
                              {sale.discount > 0 && (
                                <tr className="text-red-600">
                                  <td colSpan={4} className="py-2 text-right pr-2">
                                    Discount:
                                  </td>
                                  <td className="py-2 text-right">- RM {sale.discount.toFixed(2)}</td>
                                </tr>
                              )}
                              <tr className="text-base sm:text-lg">
                                <td colSpan={4} className="py-2 text-right pr-2">
                                  Total:
                                </td>
                                <td className="py-2 text-right text-red-700">
                                  RM {sale.total.toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {sale.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-600">
                              <strong>Notes:</strong> {sale.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          <PrintDailySales sales={todaySales} user={user} date={todayDate} />
        </div>
      </div>
    </div>
  );
}