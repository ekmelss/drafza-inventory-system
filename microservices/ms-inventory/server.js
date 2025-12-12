require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/drafza_inventory";

// ✅ Allow all origins for production
app.use(cors());

app.use(express.json());

// Routes
const inventoryRoutes = require("./routes/inventoryRoutes");
app.use("/api/inventory", inventoryRoutes);

const typeRoutes = require("./routes/typeRoutes");
app.use("/api/types", typeRoutes);

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB (Inventory Service)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Hello from D'Rafza Inventory Service!" });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Inventory Service running at http://localhost:${PORT}`);
});