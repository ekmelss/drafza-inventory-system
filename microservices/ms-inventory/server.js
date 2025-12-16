require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/drafza_inventory";

// ✅ Allow all origins for production
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://drafza-inventory-system.vercel.app",
    "https://drafza-inventory-system-git-main-ekmelss-projects.vercel.app"
  ],
  credentials: true
}));

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Inventory Service running on port ${PORT}`);
});
