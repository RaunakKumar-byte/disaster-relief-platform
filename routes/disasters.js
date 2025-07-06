const express = require("express")
const router = express.Router()
const Disaster = require("../models/Disaster") // Fix: Correct model name casing
const multer = require("multer")
const upload = multer({ dest: "uploads/" })

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  req.session.returnTo = req.originalUrl
  res.redirect("/auth/login")
}

// Show all disasters
router.get("/", async (req, res) => {
  try {
    const disasters = await Disaster.find().sort({ createdAt: -1 }).populate("reportedBy", "name organization")
    res.render("disasters/index", { title: "All Disasters", disasters })
  } catch (error) {
    console.error("Error fetching disasters:", error)
    res.status(500).render("error", {
      title: "Error",
      message: "Error fetching disasters",
    })
  }
})

// Show disaster map view
router.get("/map/view", (req, res) => {
  res.render("disasters/map-views", { title: "Disaster Map" })
})

// Show disaster report form
router.get("/report", isAuthenticated, (req, res) => {
  res.render("disasters/report", { title: "Report Disaster" })
})

// Create new disaster report
router.post("/report", isAuthenticated, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, type, severity, latitude, longitude, address } = req.body

    // Validate required fields
    if (!title || !description || !type || !latitude || !longitude || !address) {
      return res.render("disasters/report", {
        title: "Report Disaster",
        error: "Please fill in all required fields",
        formData: req.body,
      })
    }

    // Map form severity 'medium' to schema 'moderate'
    let mappedSeverity = severity;
    if (!severity || severity === 'medium') mappedSeverity = 'moderate';
    // Create new disaster
    const disaster = new Disaster({
      name: title,
      description,
      type,
      severity: mappedSeverity,
      location: {
        type: "Point",
        coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
        address,
      },
      status: "active",
      reportedBy: req.user._id,
      images: req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [],
    })

    await disaster.save()
    req.flash("success", "Disaster reported successfully")
    res.redirect(`/disasters/${disaster._id}`)
  } catch (error) {
    console.error("Error creating disaster report:", error)
    res.render("disasters/report", {
      title: "Report Disaster",
      error: "Error creating disaster report. Please try again.",
      formData: req.body,
    })
  }
})

// Show single disaster
router.get("/:id", async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id).populate("reportedBy", "name organization")

    if (!disaster) {
      return res.status(404).render("errors/404", {
        title: "404 - Not Found",
        message: "Disaster not found",
      })
    }

    res.render("disasters/show", {
      title: disaster.title,
      disaster,
    })
  } catch (error) {
    console.error("Error fetching disaster:", error)
    res.status(500).render("error", {
      title: "Error",
      message: "Error fetching disaster details",
    })
  }
})

// Update disaster status
router.post("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body
    const disaster = await Disaster.findById(req.params.id)

    if (!disaster) {
      return res.status(404).json({
        success: false,
        message: "Disaster not found",
      })
    }

    // Check if user has permission
    if (disaster.reportedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      })
    }

    disaster.status = status
    await disaster.save()

    res.json({ success: true })
  } catch (error) {
    console.error("Error updating disaster status:", error)
    res.status(500).json({
      success: false,
      message: "Error updating status",
    })
  }
})

module.exports = router

