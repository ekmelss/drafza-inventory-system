const express = require("express");
const router = express.Router();
const Item = require("../models/item"); // import the Item model
const verifyToken = require("../middleware/authMiddleware"); // Apply authentication middleware to all routes


// 🆕 Add new inventory item
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { name, category, size, stock } = req.body;

    // validation
    if (!name || !category || !size || stock === undefined) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newItem = new Item({
      name,
      category,
      size,
      stock,
    });

    await newItem.save();

    res.status(201).json({
      message: "Item added successfully!",
      item: newItem,
    });
    
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).json({ error: "Failed to add item." });
  }
});

// Get all inventory items
router.get("/", verifyToken, async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ error: "Failed to fetch inventory items." });
  }
});

// Update an inventory item by ID
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, size, stock, lowStockThreshold } = req.body;

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { name, category, size, stock, lowStockThreshold },
      { new: true } // Return the updated item
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found." });
    }

    res.status(200).json({
      message: "Item updated successfully!",
      item: updatedItem,
    });
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ error: "Failed to update inventory item." });
  }
});

// Delete an inventory item by ID
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Item.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ error: "Item not found." });
    }

    res.status(200).json({
      message: "Item deleted successfully!",
      item: deletedItem,
    });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ error: "Failed to delete inventory item." });
  }
});

// Get inventory summary (for dashboard KPIs)
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const items = await Item.find();

    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.stock > 0 && item.stock <= item.lowStockThreshold).length;
    const outOfStockItems = items.filter(item => item.stock === 0).length;

    res.status(200).json({
      totalItems,
      lowStockItems,
      outOfStockItems
    });
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).json({ error: "Failed to fetch inventory summary." });
  }
});

// ✅ Get distinct product types (from the "name" or "category" fields)
router.get("/types", verifyToken, async (req, res) => {
  try {
    const allNames = await Item.distinct("name");

    const cleanTypes = Array.from(
      new Set(
        allNames
          .map((n) => n?.split(" - ")[0]?.trim())
          .filter(Boolean)
      )
    );

    res.json(cleanTypes);
  } catch (err) {
    console.error("Error fetching types:", err);
    res.status(500).json({ error: "Failed to fetch types." });
  }
});

module.exports = router;
