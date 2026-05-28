const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const apiRoutes = require("./src/routes/routes");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173"];

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, server-to-server, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "FitSync API",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.status || 500;
  // Only expose error messages for client errors (4xx).
  // For server errors (5xx), return a generic message to avoid leaking internals.
  const message = statusCode < 500
    ? (err.message || "Request failed.")
    : "Internal server error.";
  res.status(statusCode).json({ error: message });
});

module.exports = app;
