const express = require("express");
const router = express.Router();
const Type = require("../models/type");
const verifyToken = require("../middleware/authMiddleware"); // ✅ ADD THIS

// Get all types
router.get("/", verifyToken, async (req, res) => { // ✅ ADD verifyToken
  try {
    const types = await Type.find().sort({ type: 1 });
    res.json(types);
  } catch (err) {
    console.error("Error fetching types:", err);
    res.status(500).json({ error: "Failed to fetch types." });
  }
});

// Add new type
router.post("/add", verifyToken, async (req, res) => { // ✅ ADD verifyToken
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: "Type name required." });

    const existing = await Type.findOne({ type });
    if (existing) return res.status(400).json({ error: "Type already exists." });

    const newType = new Type({ type });
    await newType.save();

    res.status(201).json({ message: "Type added successfully!", type: newType });
  } catch (err) {
    console.error("Error adding type:", err);
    res.status(500).json({ error: "Failed to add type." });
  }
});

// Delete type by ID
router.delete("/:id", verifyToken, async (req, res) => { // ✅ ADD verifyToken
  try {
    const { id } = req.params;
    const deleted = await Type.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ error: "Type not found." });

    res.json({ message: "Type deleted successfully." });
  } catch (err) {
    console.error("Error deleting type:", err);
    res.status(500).json({ error: "Failed to delete type." });
  }
});

module.exports = router;