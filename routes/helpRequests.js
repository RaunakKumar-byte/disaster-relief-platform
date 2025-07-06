const express = require("express")
const router = express.Router()
const HelpRequest = require("../models/HelpRequest")
const Disaster = require("../models/Disaster")

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  req.session.returnTo = req.originalUrl
  res.redirect("/login")
}

// Get all help requests
router.get("/", async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find().sort({ createdAt: -1 })
    res.render("help-requests/index", { title: "Help Requests", helpRequests })
  } catch (err) {
    console.error(err)
    res.status(500).render("error", { title: "Error", message: "Server error" })
  }
})

// Get help request form
router.get("/new", isAuthenticated, async (req, res) => {
  try {
    const disasters = await Disaster.find().select("_id title type location.address")
    res.render("help-requests/new", { title: "Request Help", disasters })
  } catch (err) {
    console.error(err)
    res.status(500).render("error", { title: "Error", message: "Server error" })
  }
})

// Submit help request
router.post("/new", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      latitude,
      longitude,
      address,
      urgency,
      peopleAffected,
      contactPhone,
      relatedDisaster,
    } = req.body

    // Validation
    if (!title || !description || !type || !latitude || !longitude || !address) {
      const disasters = await Disaster.find().select("_id title type location.address")
      return res.status(400).render("help-requests/new", {
        title: "Request Help",
        error: "Please fill in all required fields",
        formData: req.body,
        disasters,
      })
    }

    // Create new help request
    const newHelpRequest = new HelpRequest({
      title,
      description,
      type,
      location: {
        coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
        address,
      },
      urgency: urgency || "medium",
      requestedBy: req.user._id,
      peopleAffected: peopleAffected || 1,
      contactPhone: contactPhone || req.user.phone,
      relatedDisaster: relatedDisaster || null,
    })

    await newHelpRequest.save()

    res.redirect("/help-requests")
  } catch (err) {
    console.error(err)
    const disasters = await Disaster.find().select("_id title type location.address")
    res.status(500).render("help-requests/new", {
      title: "Request Help",
      error: "Server error during submission",
      formData: req.body,
      disasters,
    })
  }
})

// Get single help request
router.get("/:id", async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate("requestedBy", "name phone email")
      .populate("assignedTo", "name organization phone email")
      .populate("relatedDisaster", "title type severity status")

    if (!helpRequest) {
      return res.status(404).render("404", { title: "404 - Not Found" })
    }

    res.render("help-requests/show", { title: helpRequest.title, helpRequest })
  } catch (err) {
    console.error(err)
    res.status(500).render("error", { title: "Error", message: "Server error" })
  }
})

// Assign help request to self
router.post("/:id/assign", isAuthenticated, async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: "Help request not found" })
    }

    // Check if already assigned
    if (helpRequest.assignedTo) {
      return res.status(400).json({ success: false, message: "Already assigned" })
    }

    helpRequest.assignedTo = req.user._id
    helpRequest.status = "assigned"
    helpRequest.updatedAt = Date.now()
    await helpRequest.save()

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Update help request status
router.post("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body
    const helpRequest = await HelpRequest.findById(req.params.id)

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: "Help request not found" })
    }

    // Check if user is the assignee, requester, or an admin
    if (
      (!helpRequest.assignedTo || helpRequest.assignedTo.toString() !== req.user._id.toString()) &&
      helpRequest.requestedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" })
    }

    helpRequest.status = status
    helpRequest.updatedAt = Date.now()
    await helpRequest.save()

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

module.exports = router

