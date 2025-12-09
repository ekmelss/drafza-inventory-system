const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/user");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;


// Register new user
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check existing user
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username already exists" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Save new user
    const user = new User({ username, password: hashed, role });
    await user.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed." });
  }
});

module.exports = router;
