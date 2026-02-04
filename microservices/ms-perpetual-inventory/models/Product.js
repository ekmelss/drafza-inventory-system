const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ["Adult", "Kids"]
  },
  size: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  lowStockThreshold: { 
    type: Number, 
    default: 5 
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ name: 1, size: 1 });
productSchema.index({ type: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);