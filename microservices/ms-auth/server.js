const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors()); // ✅ Allow all origins for now

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB (Auth Service)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/test", (req, res) => {
  res.json({ message: "Hello from D'Rafza Auth Service!" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Auth Service running on port ${PORT}`);
});
