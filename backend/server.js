require("dotenv").config();

const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const app = require("./app");
const { initializeDatabase } = require("./src/utils/bootstrap");

const PORT = Number(process.env.PORT || 5000);

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FitSync backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start FitSync backend:", err);
    process.exit(1);
  });
