// ============================================================
// HUNAR Route — src/routes/auth.js
// POST /api/auth/register  — Create user account
// POST /api/auth/login     — Login, return JWT
// GET  /api/auth/me        — Get current user (protected)
// ============================================================

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ── Helper: sign JWT ─────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    console.log("📦 Register body:", req.body);
    const { name, phone, email, password, city, sector } = req.body;
    const user = await User.create({ name, phone, email, password, city, sector });
    const token = signToken(user._id);
    res.status(201).json({
      status: "success",
      token,
      user: { id: user._id, name: user.name, phone: user.phone, loyaltyTier: user.loyaltyTier },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ status: "error", message: "Phone and password required" });

    const user = await User.findOne({ phone }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ status: "error", message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({
      status: "success",
      token,
      user: { id: user._id, name: user.name, phone: user.phone, loyaltyTier: user.loyaltyTier },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ status: "success", user: req.user });
});

module.exports = router;
