// ============================================================
// HUNAR Tool — src/tools/sendNotification.js
// SMS/WhatsApp simulation (Twilio integration ready)
// ============================================================

const Notification = require("../models/Notification");

/**
 * Sends (or simulates) a notification and logs it to DB.
 *
 * @param {string} userId    - MongoDB ObjectId of recipient
 * @param {string} message   - Notification text
 * @param {Object} options   - { bookingId, phone, type, channel, providerId }
 * @returns {Object} notification log entry
 */
const sendNotification = async (userId, message, options = {}) => {
  const {
    bookingId,
    phone,
    type = "booking_confirmed",
    channel = "simulated",
    providerId,
  } = options;

  let status = "simulated";

  // ── Real Twilio SMS (when credentials available) ────────
  if (
    channel === "sms" &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    phone
  ) {
    try {
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      status = "sent";
      console.log(`📱 SMS sent to ${phone}`);
    } catch (err) {
      console.warn("⚠️  Twilio SMS failed, falling back to simulation:", err.message);
      status = "simulated";
    }
  } else {
    // Simulation mode — log to console
    console.log(`\n📨 [NOTIFICATION SIMULATED]`);
    console.log(`   To:      ${phone || userId}`);
    console.log(`   Type:    ${type}`);
    console.log(`   Message: ${message}\n`);
  }

  // Always persist to DB
  const notification = await Notification.create({
    userId,
    providerId,
    bookingId,
    type,
    channel: status === "sent" ? channel : "simulated",
    message,
    phone,
    status,
    sentAt: new Date(),
  });

  return notification;
};

module.exports = sendNotification;
