const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Provider = require("../models/Provider");
const { protect } = require("../middleware/auth");

const router = express.Router();

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register — users only
router.post("/register", async (req, res, next) => {
  try {
    console.log("📦 Register body:", req.body);
    const { name, phone, email, password, city, sector } = req.body;
    const user = await User.create({ name, phone, email, password, city, sector });
    const token = signToken(user._id, "user");
    res.status(201).json({
      status: "success",
      token,
      role: "user",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        sector: user.sector,
        loyaltyTier: user.loyaltyTier,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — checks both users and providers
router.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ status: "error", message: "Phone and password required" });

    // First check if this is a provider
    // Normalize phone — remove dashes for comparison
    const normalizedPhone = phone.replace(/-/g, '');
    const provider = await Provider.findOne({
      $or: [
        { phone: phone },
        { phone: normalizedPhone },
        { phone: phone.replace(/(\d{4})(\d{7})/, '$1-$2') }
      ]
    }).select("+password");
    if (provider) {
      // Provider found — check password
      const isMatch = provider.password
        ? await bcrypt.compare(password, provider.password)
        : password === "provider123"; // default password for seeded providers

      if (!isMatch)
        return res.status(401).json({ status: "error", message: "Invalid credentials" });

      const token = signToken(provider._id, "provider");
      return res.json({
        status: "success",
        token,
        role: "provider",
        user: {
          id: provider._id,
          name: provider.name,
          phone: provider.phone,
          sector: provider.sector,
          services: provider.services,
          rating: provider.rating,
        },
      });
    }

    // Check users
    const user = await User.findOne({ phone }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ status: "error", message: "Invalid credentials" });

    const token = signToken(user._id, "user");
    res.json({
      status: "success",
      token,
      role: "user",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        sector: user.sector,
        loyaltyTier: user.loyaltyTier,
      },
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