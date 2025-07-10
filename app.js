const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const session = require("express-session")
const flash = require("connect-flash")
const passport = require("passport")
const methodOverride = require("method-override")
const morgan = require("morgan")

// Routes
const indexRoutes = require("./routes/index")
const authRoutes = require("./routes/auth")
const disasterRoutes = require("./routes/disasters")
const resourceRoutes = require("./routes/resources")
const helpRequestRoutes = require("./routes/helpRequests")
const apiRoutes = require("./routes/api")

const app = express()

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI
console.log("MongoDB URI:", MONGODB_URI)

// Session secret
const SESSION_SECRET = process.env.SESSION_SECRET || "mysecretkey"
console.log("Session Secret:", SESSION_SECRET)

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => {
  console.error("MongoDB connection error:", err)
  process.exit(1)
})

// EJS and views
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Middleware
app.use(morgan("dev"))
app.use(express.static(path.join(__dirname, "public")))
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride("_method"))

// Session middleware
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Only secure cookies in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}))

// Flash messages
app.use(flash())

// Passport config
require("./config/passport")(passport)
app.use(passport.initialize())
app.use(passport.session())

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null
  res.locals.success = req.flash("success")
  res.locals.error = req.flash("error")
  next()
})

// Routes
app.use("/", indexRoutes)
app.use("/auth", authRoutes)
app.use("/disasters", disasterRoutes)
app.use("/resources", resourceRoutes)
app.use("/help-requests", helpRequestRoutes)
app.use("/api", apiRoutes)

// Error pages
app.use((req, res) => {
  res.status(404).render("errors/404", { title: "404 - Not Found" })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).render("errors/500", {
    title: "500 - Server Error",
    error: err,
  })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
