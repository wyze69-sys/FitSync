const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const apiRoutes = require("./src/routes/routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorMiddleware");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "FitSync API",
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use("/api", apiRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

module.exports = app;
