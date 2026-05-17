// ============================================================
// HUNAR — src/middleware/errorHandler.js
// Global error handler — must be last middleware in app.js
// ============================================================

const errorHandler = (err, req, res, next) => {
  console.error(`\n❌ [ERROR HANDLER] ${err.message}`);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ status: "error", message: errors.join(", ") });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: "error",
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }

  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
