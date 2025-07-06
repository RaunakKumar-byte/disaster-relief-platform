const express = require("express")
const router = express.Router()
const Disaster = require("../models/Disaster")
const Resource = require("../models/resource")
const HelpRequest = require("../models/HelpRequest")

// Get all disasters
router.get("/disasters", async (req, res) => {
  try {
    const disasters = await Disaster.find().populate("reportedBy", "name organization").sort({ createdAt: -1 })

    res.json(disasters)
  } catch (error) {
    console.error("API Error fetching disasters:", error)
    res.status(500).json({ error: "Error fetching disasters" })
  }
})

// Get all resources
router.get("/resources", async (req, res) => {
  try {
    const resources = await Resource.find().populate("providedBy", "name organization").sort({ createdAt: -1 })

    res.json(resources)
  } catch (error) {
    console.error("API Error fetching resources:", error)
    res.status(500).json({ error: "Error fetching resources" })
  }
})

// Get all help requests
router.get("/help-requests", async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find().populate("requestedBy", "name organization").sort({ createdAt: -1 })

    res.json(helpRequests)
  } catch (error) {
    console.error("API Error fetching help requests:", error)
    res.status(500).json({ error: "Error fetching help requests" })
  }
})

// Get disaster by ID
router.get("/disasters/:id", async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id).populate("reportedBy", "name organization")

    if (!disaster) {
      return res.status(404).json({ error: "Disaster not found" })
    }

    res.json(disaster)
  } catch (error) {
    console.error("API Error fetching disaster:", error)
    res.status(500).json({ error: "Error fetching disaster" })
  }
})

// Get resources near a location
router.get("/resources/near", async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude are required" })
    }

    const resources = await Resource.find({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: Number.parseInt(radius) * 1000, // Convert km to meters
        },
      },
      status: "available",
    }).populate("providedBy", "name organization")

    res.json(resources)
  } catch (error) {
    console.error("API Error fetching nearby resources:", error)
    res.status(500).json({ error: "Error fetching nearby resources" })
  }
})

// Get help requests near a location
router.get("/help-requests/near", async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude are required" })
    }

    const helpRequests = await HelpRequest.find({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: Number.parseInt(radius) * 1000, // Convert km to meters
        },
      },
      status: { $in: ["open", "assigned"] },
    }).populate("requestedBy", "name organization")

    res.json(helpRequests)
  } catch (error) {
    console.error("API Error fetching nearby help requests:", error)
    res.status(500).json({ error: "Error fetching nearby help requests" })
  }
})

module.exports = router

