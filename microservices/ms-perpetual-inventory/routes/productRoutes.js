const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Type = require("../models/Type");
const Inventory = require("../models/Inventory");
const verifyToken = require("../middleware/authMiddleware");

// Get all products (shared catalog)
router.get("/", verifyToken, async (req, res) => {
  try {
    const products = await Product.find().sort({ type: 1, name: 1 });
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Add new product to catalog
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { name, type, category, size, price, lowStockThreshold } = req.body;

    // Validate required fields
    if (!name || !type || !category || !size || price === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create new product
    const newProduct = new Product({
      name,
      type,
      category,
      size,
      price,
      lowStockThreshold: lowStockThreshold || 5
    });

    await newProduct.save();

    // Auto-create inventory entries for all locations with 0 stock
    const locations = ["pkns", "kipmall", "spare"];
    const inventoryPromises = locations.map(location => {
      const inventory = new Inventory({
        productId: newProduct._id,
        location,
        stock: 0
      });
      return inventory.save();
    });

    await Promise.all(inventoryPromises);

    res.status(201).json({
      message: "Product added successfully",
      product: newProduct
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Update product
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { name, type, category, size, price, lowStockThreshold } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, type, category, size, price, lowStockThreshold },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product (also deletes all inventory records)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete all inventory records for this product
    await Inventory.deleteMany({ productId: req.params.id });

    res.json({
      message: "Product deleted successfully",
      product
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Get all product types
router.get("/types/list", verifyToken, async (req, res) => {
  try {
    const types = await Type.find().sort({ type: 1 });
    res.json(types);
  } catch (err) {
    console.error("Error fetching types:", err);
    res.status(500).json({ error: "Failed to fetch types" });
  }
});

// Add new product type
router.post("/types/add", verifyToken, async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) {
      return res.status(400).json({ error: "Type name required" });
    }

    const existing = await Type.findOne({ type });
    if (existing) {
      return res.status(400).json({ error: "Type already exists" });
    }

    const newType = new Type({ type });
    await newType.save();

    res.status(201).json({
      message: "Type added successfully",
      type: newType
    });
  } catch (err) {
    console.error("Error adding type:", err);
    res.status(500).json({ error: "Failed to add type" });
  }
});

// Delete product type
router.delete("/types/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Type.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Type not found" });
    }

    res.json({ message: "Type deleted successfully" });
  } catch (err) {
    console.error("Error deleting type:", err);
    res.status(500).json({ error: "Failed to delete type" });
  }
});

module.exports = router;