const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Ensure DB is connected before handling API requests (critical for Vercel serverless)
app.use(async (req, res, next) => {
  if (req.path === "/api/health") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ Database connection middleware error:", err.message);
    res.status(500).json({
      status: "error",
      message: "Database connection failure: " + err.message,
    });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "HUNAR API running",
    timestamp: new Date(),
    agent: "HUNAR Agentic Orchestrator v1.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ============================================================
// ROUTES
// ============================================================
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/parse-request", require("./src/routes/parse"));
app.use("/api/providers", require("./src/routes/providers"));
app.use("/api/match", require("./src/routes/match"));
app.use("/api/price", require("./src/routes/price"));
app.use("/api/book", require("./src/routes/book"));
app.use("/api/tracking", require("./src/routes/tracking"));
app.use("/api/feedback", require("./src/routes/feedback"));
app.use("/api/dispute", require("./src/routes/dispute"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/provider", require("./src/routes/providerAuth"));

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error(`\n❌ [ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// ============================================================
// SERVER START (Local environment)
// ============================================================
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`🚀 HUNAR API running on port ${PORT}`);
        console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`❌ Port ${PORT} is busy.`);
          process.exit(1);
        }
      });
    })
    .catch((err) => {
      console.error("❌ Startup DB connection failed:", err.message);
    });
}

module.exports = app;