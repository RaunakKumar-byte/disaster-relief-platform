const express = require("express")
const router = express.Router()
const Disaster = require("../models/Disaster")
const Resource = require("../models/resource")
const HelpRequest = require("../models/HelpRequest")

// Home page
router.get("/", async (req, res) => {
  try {
    // Get recent disasters
    const recentDisasters = await Disaster.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("reportedBy", "name organization")

    // Get available resources
    const availableResources = await Resource.find({ status: "available" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("providedBy", "name organization")

    // Get open help requests
    const openHelpRequests = await HelpRequest.find({ status: "open" })
      .sort({ urgency: -1, createdAt: -1 })
      .limit(3)
      .populate("requestedBy", "name")

    res.render("home", {
      title: "Home",
      recentDisasters,
      availableResources,
      openHelpRequests,
    })
  } catch (error) {
    console.error("Error fetching data for home page:", error)
    res.render("home", {
      title: "Home",
      error: "Error loading recent data",
    })
  }
})

// Redirect /login and /register to /auth/login and /auth/register
router.get("/login", (req, res) => res.redirect("/auth/login"))
router.get("/register", (req, res) => res.redirect("/auth/register"))

router.get("/profile", (req, res) => res.redirect("/auth/profile"))
router.get("/logout", (req, res) => res.redirect("/auth/logout"))

module.exports = router

