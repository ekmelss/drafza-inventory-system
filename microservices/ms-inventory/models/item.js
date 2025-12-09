const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  size: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 }, // ✅ ADD THIS
  lowStockThreshold: { type: Number, default: 5 },
}, {
  timestamps: true // ✅ Optional: adds createdAt and updatedAt automatically
});

module.exports = mongoose.models.Item || mongoose.model("Item", itemSchema);