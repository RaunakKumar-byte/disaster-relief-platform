const express = require("express")
const router = express.Router()
const Resource = require("../models/Resource")

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  req.session.returnTo = req.originalUrl
  res.redirect("/login")
}

// Get all resources
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 }).populate("providedBy", "name organization")
    res.render("resources/index", { title: "Available Resources", resources })
  } catch (err) {
    console.error(err)
    res.status(500).render("error", { title: "Error", message: "Server error" })
  }
})

// Get resource form
router.get("/add", isAuthenticated, (req, res) => {
  res.render("resources/add", { title: "Add Resource" })
})

// Submit resource
router.post("/add", isAuthenticated, async (req, res) => {
  try {
    const { name, type, quantity, unit, latitude, longitude, address, description, expiryDate } = req.body

    // Validation
    if (!name || !type || !quantity || !unit || !latitude || !longitude || !address) {
      return res.status(400).render("resources/add", {
        title: "Add Resource",
        error: "Please fill in all required fields",
        formData: req.body,
      })
    }

    // Create new resource
    const newResource = new Resource({
      name,
      type,
      quantity: Number.parseFloat(quantity),
      unit,
      location: {
        coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
        address,
      },
      providedBy: req.user._id,
      description: description || "",
      expiryDate: expiryDate || null,
    })

    await newResource.save()

    res.redirect("/resources")
  } catch (err) {
    console.error(err)
    res.status(500).render("resources/add", {
      title: "Add Resource",
      error: "Server error during submission",
      formData: req.body,
    })
  }
})

// Get single resource
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("providedBy", "name organization phone email")

    if (!resource) {
      return res.status(404).render("404", { title: "404 - Not Found" })
    }

    res.render("resources/show", { title: resource.name, resource })
  } catch (err) {
    console.error(err)
    res.status(500).render("error", { title: "Error", message: "Server error" })
  }
})

// Update resource status
router.post("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body
    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" })
    }

    // Check if user is the provider or an admin
    if (resource.providedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" })
    }

    resource.status = status
    resource.updatedAt = Date.now()
    await resource.save()

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

module.exports = router

