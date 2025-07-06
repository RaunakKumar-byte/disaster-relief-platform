const mongoose = require("mongoose");

const HelpRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["food", "water", "medical", "shelter", "evacuation", "other"],
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
  urgency: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["open", "assigned", "in-progress", "resolved"],
    default: "open",
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  peopleAffected: {
    type: Number,
    default: 1,
  },
  contactPhone: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  relatedDisaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Disaster",
  },
});

// Create index for geospatial queries
HelpRequestSchema.index({ "location.coordinates": "2dsphere" });

// Use existing model if already defined, otherwise define a new one
const HelpRequest = mongoose.models.HelpRequest || mongoose.model("HelpRequest", HelpRequestSchema);

module.exports = HelpRequest;
