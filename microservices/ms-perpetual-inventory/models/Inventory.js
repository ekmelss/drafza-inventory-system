const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",
    required: true 
  },
  location: { 
    type: String, 
    required: true,
    enum: ["pkns", "kipmall", "spare"]
  },
  stock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Compound index to ensure one inventory record per product per location
inventorySchema.index({ productId: 1, location: 1 }, { unique: true });

// Index for location-based queries
inventorySchema.index({ location: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);