const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const verifyToken = require("../middleware/authMiddleware");

// Generate unique sale number
function generateSaleNumber(location) {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = date.getTime().toString().slice(-4);
  const locPrefix = location.toUpperCase().substring(0, 3);
  return `${locPrefix}-${dateStr}-${timeStr}`;
}

// Create new sale (with automatic inventory deduction)
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { items, subtotal, discount, total, paymentMethod, notes } = req.body;
    const userLocation = req.user.location;
    const username = req.user.username;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Sale must have at least one item" });
    }

    if (subtotal === undefined || total === undefined) {
      return res.status(400).json({ error: "Subtotal and total are required" });
    }

    // Start a session for transaction (ensures all operations succeed or all fail)
    const session = await Sale.startSession();
    session.startTransaction();

    try {
      // Check stock availability for all items
      const stockChecks = await Promise.all(
        items.map(async (item) => {
          const inventory = await Inventory.findOne({
            productId: item.productId,
            location: userLocation
          }).session(session);

          if (!inventory) {
            throw new Error(`Product ${item.productName} not found in inventory`);
          }

          if (inventory.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${item.productName} (${item.size}). Available: ${inventory.stock}, Requested: ${item.quantity}`
            );
          }

          return { inventory, item };
        })
      );

      // Deduct stock from inventory (PERPETUAL UPDATE)
      await Promise.all(
        stockChecks.map(({ inventory, item }) => {
          return Inventory.findByIdAndUpdate(
            inventory._id,
            { 
              $inc: { stock: -item.quantity },
              lastUpdated: new Date()
            },
            { session }
          );
        })
      );

      // Create sale record
      const saleNumber = generateSaleNumber(userLocation);
      const newSale = new Sale({
        saleNumber,
        location: userLocation,
        soldBy: username,
        items,
        subtotal,
        discount: discount || 0,
        total,
        paymentMethod: paymentMethod || "cash",
        notes: notes || "",
        createdBy: username
      });

      await newSale.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Sale completed successfully",
        sale: newSale
      });

    } catch (error) {
      // Rollback transaction if any error occurs
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (err) {
    console.error("Error creating sale:", err);
    res.status(500).json({ 
      error: err.message || "Failed to create sale" 
    });
  }
});

// Get all sales for user's location
router.get("/", verifyToken, async (req, res) => {
  try {
    const userLocation = req.user.location;
    const { startDate, endDate, limit = 100 } = req.query;

    // Build query
    const query = { location: userLocation };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(sales);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

// Get single sale by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    // Ensure user can only view sales from their location
    if (sale.location !== req.user.location) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(sale);
  } catch (err) {
    console.error("Error fetching sale:", err);
    res.status(500).json({ error: "Failed to fetch sale" });
  }
});

// Get sales summary/statistics
router.get("/reports/summary", verifyToken, async (req, res) => {
  try {
    const userLocation = req.user.location;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = { location: userLocation };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const sales = await Sale.find(dateFilter);

    // Calculate statistics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
    const totalItemsSold = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    // Calculate average sale value
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Group by date
    const salesByDate = {};
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { count: 0, revenue: 0 };
      }
      salesByDate[date].count++;
      salesByDate[date].revenue += sale.total;
    });

    res.json({
      totalSales,
      totalRevenue: totalRevenue.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalItemsSold,
      avgSaleValue: avgSaleValue.toFixed(2),
      salesByDate
    });
  } catch (err) {
    console.error("Error fetching sales summary:", err);
    res.status(500).json({ error: "Failed to fetch sales summary" });
  }
});

// Get today's sales
router.get("/reports/today", verifyToken, async (req, res) => {
  try {
    const userLocation = req.user.location;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sales = await Sale.find({
      location: userLocation,
      createdAt: { $gte: startOfDay }
    }).sort({ createdAt: -1 });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;

    res.json({
      sales,
      totalRevenue: totalRevenue.toFixed(2),
      totalTransactions
    });
  } catch (err) {
    console.error("Error fetching today's sales:", err);
    res.status(500).json({ error: "Failed to fetch today's sales" });
  }
});

// Delete/void a sale (admin only - requires inventory restoration)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    // Ensure sale is from user's location
    if (sale.location !== req.user.location) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Start transaction to restore inventory
    const session = await Sale.startSession();
    session.startTransaction();

    try {
      // Restore stock for all items
      await Promise.all(
        sale.items.map(item => {
          return Inventory.findOneAndUpdate(
            { productId: item.productId, location: sale.location },
            { 
              $inc: { stock: item.quantity },
              lastUpdated: new Date()
            },
            { session }
          );
        })
      );

      // Delete the sale
      await Sale.findByIdAndDelete(req.params.id, { session });

      await session.commitTransaction();
      session.endSession();

      res.json({ message: "Sale voided and inventory restored" });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (err) {
    console.error("Error voiding sale:", err);
    res.status(500).json({ error: "Failed to void sale" });
  }
});

module.exports = router;