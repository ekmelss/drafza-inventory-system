require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/drafza_perpetual";

// 3 Static Users Configuration
const users = [
  {
    username: "drafza1",
    password: "Akmal123",  // Change this in production
    location: "pkns",
    displayName: "PKNS Bazaar",
    role: "staff"
  },
  {
    username: "drafza2",
    password: "Akmal123",  // Change this in production
    location: "kipmall",
    displayName: "Kipmall / Bangi Gateway",
    role: "staff"
  },
  {
    username: "drafza3",
    password: "Akmal123",  // Change this in production
    location: "spare",
    displayName: "Backup Account",
    role: "staff"
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("🗑️  Cleared existing users");

    // Create new users
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        username: userData.username,
        password: hashedPassword,
        location: userData.location,
        displayName: userData.displayName,
        role: userData.role
      });

      await user.save();
      console.log(`✅ Created user: ${userData.username} (${userData.displayName})`);
    }

    console.log("\n🎉 All users seeded successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    users.forEach(u => {
      console.log(`  Username: ${u.username}`);
      console.log(`  Password: ${u.password}`);
      console.log(`  Location: ${u.location}`);
      console.log(`  Display:  ${u.displayName}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
}

seedUsers();