const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// Login only (no registration - use seed script to create users)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate token (all users are staff, role is just for future use)
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        location: user.location,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "8h" } // Longer session for seasonal work
    );

    res.json({ 
      message: "Login successful", 
      token,
      user: {
        username: user.username,
        location: user.location,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Verify token endpoint (for frontend to check if token is still valid)
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      valid: true,
      user: {
        username: user.username,
        location: user.location,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
});

module.exports = router;