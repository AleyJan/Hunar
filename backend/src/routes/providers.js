// ============================================================
// HUNAR Route — src/routes/providers.js
// GET /api/providers?service=ac_repair&sector=G-13
// ============================================================

const express = require("express");
const Provider = require("../models/Provider");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/providers
router.get("/", protect, async (req, res, next) => {
  try {
    const { service, sector, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };

    if (service) filter.services = service;
    if (sector)  filter.sector  = sector;

    const providers = await Provider.find(filter)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Provider.countDocuments(filter);

    res.json({
      status: "success",
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: providers,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/providers/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider)
      return res.status(404).json({ status: "error", message: "Provider not found" });
    res.json({ status: "success", data: provider });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
