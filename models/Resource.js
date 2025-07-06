const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["food", "water", "medical", "shelter", "clothing", "other"],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
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
  providedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "in-transit", "delivered", "depleted"],
    default: "available",
  },
  description: {
    type: String,
  },
  expiryDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for geospatial queries
ResourceSchema.index({ "location.coordinates": "2dsphere" });

// Use existing model if already defined, otherwise define a new one
const Resource = mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);

module.exports = Resource;
