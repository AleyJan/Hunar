const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

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
// MONGODB + SERVER START
// ============================================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not defined in .env — exiting");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected — Atlas cluster online");

    const server = app.listen(PORT, () => {
      console.log(`🚀 HUNAR API running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is busy. Run this to fix it:`);
        console.error(`   netstat -ano | findstr :${PORT}`);
        console.error(`   taskkill /PID <number you see> /F`);
        process.exit(1);
      }
    });

    process.on("SIGINT", () => {
      server.close(() => {
        console.log("\n👋 Server closed cleanly");
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });