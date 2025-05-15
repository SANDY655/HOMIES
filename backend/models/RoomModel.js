const mongoose = require("mongoose");
const roomSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Add this
    email: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    rent: { type: Number, required: true },
    deposit: { type: Number, required: true },
    availableFrom: { type: Date, required: true },
    roomType: {
      type: String,
      enum: ["single", "shared", "apartment"],
      required: true,
    },
    images: [{ type: String }],
    amenities: {
      wifi: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      furnished: { type: Boolean, default: false },
      washingMachine: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const RoomModel = mongoose.model("Room", roomSchema);

module.exports = { RoomModel };
