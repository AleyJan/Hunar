// ============================================================
// HUNAR — src/config/db.js
// MongoDB Atlas connection with Serverless Connection Caching (Vercel)
// ============================================================

const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not defined");
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };
    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongooseInstance) => {
      console.log("✅ MongoDB connected — Atlas cluster online");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB connection failed:", e.message);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
