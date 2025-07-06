const mongoose = require("mongoose");

const DisasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["earthquake", "flood", "hurricane", "wildfire", "other"],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  severity: {
    type: String,
    enum: ["low", "moderate", "severe", "critical"],
    default: "moderate",
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "contained", "resolved"],
    default: "active",
  },
  description: {
    type: String,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for geospatial queries
DisasterSchema.index({ "location.coordinates": "2dsphere" });

// Use existing model if already defined, otherwise define a new one
const Disaster = mongoose.models.Disaster || mongoose.model("Disaster", DisasterSchema);

module.exports = Disaster;
