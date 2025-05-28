const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// This tells MongoDB to automatically delete documents once `expiresAt` is passed
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpSchemaModel = mongoose.model("Otp", otpSchema);

module.exports = { OtpSchemaModel };
