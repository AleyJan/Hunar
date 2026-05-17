// ============================================================
// HUNAR — src/models/User.js
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^(\+92|0)[0-9]{10}$/, "Enter a valid Pakistani phone number"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never return password in queries
    },
    city: { type: String, default: "Islamabad" },
    sector: { type: String, default: "" },
    bookingCount: { type: Number, default: 0 },
    loyaltyTier: {
      type: String,
      enum: ["bronze", "silver", "gold"],
      default: "bronze",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Auto-update loyalty tier based on booking count
userSchema.methods.updateLoyalty = function () {
  if (this.bookingCount >= 10) this.loyaltyTier = "gold";
  else if (this.bookingCount >= 5) this.loyaltyTier = "silver";
  else this.loyaltyTier = "bronze";
};

module.exports = mongoose.model("User", userSchema);
