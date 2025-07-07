const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const User = require("../models/User")

// Login page
router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/auth/profile")
  }
  res.render("auth/login", { title: "Login" })
})

// Register page
router.get("/register", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/auth/profile")
  }
  res.render("auth/register", { title: "Register" })
})

// Login process
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      req.flash("error", "Invalid email or password")
      return res.redirect("/auth/login")
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      req.flash("error", "Invalid email or password")
      return res.redirect("/auth/login")
    }

    // Log in user
    req.login(user, (err) => {
      if (err) {
        return next(err)
      }
      const redirectTo = req.session.returnTo || "/auth/profile"
      delete req.session.returnTo
      res.redirect(redirectTo)
    })
  } catch (error) {
    console.error("Login error:", error)
    req.flash("error", "Error during login")
    res.redirect("/auth/login")
  }
})

// Register process
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, password2, role, organization, phone } = req.body

    // Validation
    if (!name || !email || !password || !password2) {
      req.flash("error", "Please fill in all required fields")
      return res.redirect("/auth/register")
    }

    if (password !== password2) {
      req.flash("error", "Passwords do not match")
      return res.redirect("/auth/register")
    }

    if (password.length < 6) {
      req.flash("error", "Password should be at least 6 characters")
      return res.redirect("/auth/register")
    }

    // Check if email exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      req.flash("error", "Email already registered")
      return res.redirect("/auth/register")
    }


    // Hash password
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt)
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "volunteer",
      organization: organization || "",
      phone: phone || "",
    })
    newUser.password = hashedPassword 


    await newUser.save()

    req.flash("success", "Registration successful! Please log in.")
    res.redirect("/auth/login")
  } catch (error) {
    console.error("Registration error:", error)
    req.flash("error", "Error during registration")
    res.redirect("/auth/register")
  }
})

// Logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    req.flash("success", "You have been logged out")
    res.redirect("/")
  })
})

// Profile page
router.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/auth/login")
  }
  res.render("profile", { title: "My Profile", user: req.user })
})

module.exports = router

