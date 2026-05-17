// ============================================================
// HUNAR Route — src/routes/parse.js
// POST /api/parse-request
// Step 1: Intent parsing via Claude AI
// ============================================================

const express = require("express");
const { protect } = require("../middleware/auth");
const intentParser = require("../agent/steps/intentParser");

const router = express.Router();

// POST /api/parse-request
router.post("/", protect, async (req, res, next) => {
  try {
    const { message, userSector } = req.body;

    if (!message) {
      return res.status(400).json({ status: "error", message: "message is required" });
    }

    const result = await intentParser(message, { userSector });

    res.json({
      status: "success",
      step: "INTENT_UNDERSTANDING",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
