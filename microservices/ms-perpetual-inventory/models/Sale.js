const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",
    required: true 
  },
  productName: { 
    type: String, 
    required: true 
  },
  size: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  unitPrice: { 
    type: Number, 
    required: true 
  },
  subtotal: { 
    type: Number, 
    required: true 
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  location: { 
    type: String, 
    required: true,
    enum: ["pkns", "kipmall", "spare"]
  },
  soldBy: { 
    type: String, 
    required: true 
  },
  items: [saleItemSchema],
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  discount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  total: { 
    type: Number, 
    required: true,
    min: 0
  },
  paymentMethod: { 
    type: String, 
    enum: ["cash", "card", "online", "other"],
    default: "cash"
  },
  notes: { 
    type: String,
    default: ""
  },
  createdBy: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true
});

// Index for efficient queries
saleSchema.index({ location: 1, createdAt: -1 });
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Sale", saleSchema);