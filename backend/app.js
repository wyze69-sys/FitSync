const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./src/config/swagger");
const apiRoutes = require("./src/routes/routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorMiddleware");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:4174", "http://127.0.0.1:4174"];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (e.g., mobile apps, server-to-server, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`[CORS Blocked] Request from origin "${origin}" is not allowed. Allowed origins:`, allowedOrigins);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: "100kb" }));

// Fresh interactive API documentation. Disable caching so Swagger never shows
// an old specification after the backend restarts.
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(swaggerSpec);
});

app.use(
  "/api-docs",
  (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "FitSync API — Swagger",
    explorer: false,
    swaggerOptions: {
      persistAuthorization: false,
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
      tryItOutEnabled: true
    }
  })
);

// Global rate limiting to protect every endpoint from abuse.
// Stricter, auth-specific limits are layered on top in authRoutes.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: "Too many requests. Please slow down and try again shortly." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", globalLimiter);

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
