const cors = require("cors");
const express = require("express");
const apiRoutes = require("./src/routes/routes");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

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
  res.status(err.status || 500).json({
    error: err.message || "Internal server error."
  });
});

module.exports = app;
