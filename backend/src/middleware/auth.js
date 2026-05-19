// ============================================================
// HUNAR — src/middleware/auth.js
// JWT verification middleware — handles both users and providers
// ============================================================
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Provider = require("../models/Provider");

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

    // Check role from token — load correct model
    if (decoded.role === "provider") {
      const provider = await Provider.findById(decoded.id).select("-password");
      if (!provider) {
        return res.status(401).json({ status: "error", message: "Provider no longer exists" });
      }
      req.user = { ...provider.toObject(), role: "provider" };
    } else {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ status: "error", message: "User no longer exists" });
      }
      req.user = { ...user.toObject(), role: "user" };
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

const providerOnly = (req, res, next) => {
  if (req.user?.role !== "provider") {
    return res.status(403).json({
      status: "error",
      message: "Access denied — providers only",
    });
  }
  next();
};

module.exports = { protect, adminOnly, providerOnly };