/******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 ******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const session = require("express-session")
const flash = require("connect-flash")
const messages = require("express-messages")
const app = express()
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const utilities = require("./utilities/index")
const pool = require("./database/")

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // Path to the layout file

/* ***********************
 * Middleware
 *************************/

// Session setup with PostgreSQL store
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))

// Flash messages
app.use(flash())
app.use(function(req, res, next){
  res.locals.messages = messages(req, res)
  next()
})

// ✅ Static file middleware (for CSS, JS, images)
app.use(express.static("public"))

/* ***********************
 * Routes
 *************************/
app.use(static)

// Index Route
app.get("/", utilities.handleErrors(baseController.buildHome))

// Inventory Routes
app.use("/inv", inventoryRoute)

/* ***********************
 * File Not Found Route - must be last route in list
 *************************/
app.use(async (req, res, next) => {
  next({ status: 404, message: 'Sorry, we appear to have lost that page.' })
})

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav()
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  const message = err.status == 404
    ? err.message
    : "Oh no! There was a crash. Maybe try a different route?"
  res.status(err.status || 500).render("errors/error", {
    title: err.status || "Server Error",
    message,
    nav,
  })
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5500
const host = process.env.HOST || "localhost"

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`App listening on ${host}:${port}`)
})
