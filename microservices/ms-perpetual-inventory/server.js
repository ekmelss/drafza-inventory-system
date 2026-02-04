require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/drafza_perpetual";

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://drafza-inventory-system.vercel.app",
    "https://drafza-inventory-system-git-main-ekmelss-projects.vercel.app",
    /\.vercel\.app$/
  ],
  credentials: true
}));

// ADD THESE TWO LINES:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const salesRoutes = require("./routes/salesRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);

// MongoDB connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB (Perpetual Inventory System)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test route
app.get("/test", (req, res) => {
  res.json({ 
    message: "D'Rafza Perpetual Inventory System",
    version: "2.0",
    services: ["auth", "products", "inventory", "sales"]
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Perpetual Inventory System running on port ${PORT}`);
});