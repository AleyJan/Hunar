// ============================================================
// HUNAR — src/middleware/auth.js
// JWT verification middleware
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Not authorized — no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "User no longer exists" });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied — admin only",
    });
  }
  next();
};

module.exports = { protect, adminOnly };
