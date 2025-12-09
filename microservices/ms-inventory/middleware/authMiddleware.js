const jwt = require("jsonwebtoken");
require("dotenv").config(); // ✅ Load environment variables

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expect "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // ✅ Use shared secret from .env
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET not found in environment variables!");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
}

module.exports = verifyToken;
