const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const verifyToken = require("../middleware/authMiddleware");

// Get inventory for user's location (with product details)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userLocation = req.user.location;

    const inventory = await Inventory.find({ location: userLocation })
      .populate("productId")
      .sort({ "productId.type": 1, "productId.name": 1 });

    // Format response with product details
    const formattedInventory = inventory.map(inv => ({
      _id: inv._id,
      productId: inv.productId._id,
      name: inv.productId.name,
      type: inv.productId.type,
      category: inv.productId.category,
      size: inv.productId.size,
      price: inv.productId.price,
      stock: inv.stock,
      lowStockThreshold: inv.productId.lowStockThreshold,
      location: inv.location,
      lastUpdated: inv.lastUpdated
    }));

    res.json(formattedInventory);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Get inventory summary (dashboard KPIs)
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const userLocation = req.user.location;

    const inventory = await Inventory.find({ location: userLocation })
      .populate("productId");

    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(inv => 
      inv.stock > 0 && inv.stock <= inv.productId.lowStockThreshold
    ).length;
    const outOfStockItems = inventory.filter(inv => inv.stock === 0).length;
    const totalStockValue = inventory.reduce((sum, inv) => 
      sum + (inv.stock * inv.productId.price), 0
    );

    res.json({
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalStockValue: totalStockValue.toFixed(2)
    });
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// Update stock for a specific product at user's location
router.put("/:productId", verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;
    const userLocation = req.user.location;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ error: "Valid stock quantity required" });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { productId, location: userLocation },
      { stock, lastUpdated: new Date() },
      { new: true, upsert: true }
    ).populate("productId");

    res.json({
      message: "Stock updated successfully",
      inventory
    });
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// Bulk update stocks (for initial stock entry)
router.post("/bulk-update", verifyToken, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, stock }
    const userLocation = req.user.location;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "Updates array required" });
    }

    const updatePromises = updates.map(({ productId, stock }) => {
      return Inventory.findOneAndUpdate(
        { productId, location: userLocation },
        { stock, lastUpdated: new Date() },
        { new: true, upsert: true }
      );
    });

    await Promise.all(updatePromises);

    res.json({ message: "Bulk update successful" });
  } catch (err) {
    console.error("Error bulk updating:", err);
    res.status(500).json({ error: "Failed to bulk update stocks" });
  }
});

// Get low stock items
router.get("/alerts/low-stock", verifyToken, async (req, res) => {
  try {
    const userLocation = req.user.location;

    const inventory = await Inventory.find({ location: userLocation })
      .populate("productId");

    const lowStockItems = inventory
      .filter(inv => inv.stock > 0 && inv.stock <= inv.productId.lowStockThreshold)
      .map(inv => ({
        productId: inv.productId._id,
        name: inv.productId.name,
        size: inv.productId.size,
        stock: inv.stock,
        threshold: inv.productId.lowStockThreshold
      }));

    res.json(lowStockItems);
  } catch (err) {
    console.error("Error fetching low stock:", err);
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
});

// Get out of stock items
router.get("/alerts/out-of-stock", verifyToken, async (req, res) => {
  try {
    const userLocation = req.user.location;

    const inventory = await Inventory.find({ 
      location: userLocation,
      stock: 0 
    }).populate("productId");

    const outOfStockItems = inventory.map(inv => ({
      productId: inv.productId._id,
      name: inv.productId.name,
      size: inv.productId.size
    }));

    res.json(outOfStockItems);
  } catch (err) {
    console.error("Error fetching out of stock:", err);
    res.status(500).json({ error: "Failed to fetch out of stock items" });
  }
});

module.exports = router;