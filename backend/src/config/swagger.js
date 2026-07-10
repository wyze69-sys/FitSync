const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "FitSync API",
      version: "1.0.0",
      description:
        "Interactive API documentation for FitSync. Use the Authorize button with a JWT returned by /api/auth/login to test protected endpoints."
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Local development server"
      }
    ],
    tags: [
      { name: "System", description: "Service health" },
      { name: "Authentication", description: "Registration, login, and current session" },
      { name: "Workouts", description: "Authenticated workout history and logging" },
      { name: "Gamification", description: "XP, levels, and daily check-ins" },
      { name: "Admin", description: "Admin-only operations" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste the JWT token returned by /api/auth/login. Do not include the word Bearer."
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string", example: "Authentication required." } }
        },
        AuthRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "student@example.com" },
            password: { type: "string", format: "password", example: "Password123" }
          }
        },
        RegisterRequest: {
          allOf: [
            { $ref: "#/components/schemas/AuthRequest" },
            {
              type: "object",
              required: ["name"],
              properties: { name: { type: "string", example: "LINH RATH HENRY" } }
            }
          ]
        },
        WorkoutRequest: {
          type: "object",
          required: ["date", "title", "durationMin"],
          properties: {
            date: { type: "string", format: "date", example: "2026-07-10" },
            title: { type: "string", example: "Morning Run" },
            categorySlug: { type: "string", example: "cardio" },
            activitySlug: { type: "string", example: "running" },
            durationMin: { type: "number", example: 30 },
            distanceKm: { type: "number", example: 3 },
            notes: { type: "string", example: "Swagger API test" }
          }
        },
        CheckinRequest: {
          type: "object",
          properties: { type: { type: "string", example: "Wellness check-in" } }
        }
      }
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Check API health",
          responses: {
            200: {
              description: "FitSync API is running",
              content: {
                "application/json": {
                  example: { status: "healthy", service: "FitSync API", timestamp: "2026-07-10T00:00:00.000Z" }
                }
              }
            }
          }
        }
      },
      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a user account",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } }
          },
          responses: {
            201: { description: "Account created" },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
          }
        }
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in and receive a JWT",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRequest" } } }
          },
          responses: {
            200: { description: "Authenticated; copy the token into Authorize" },
            401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
          }
        }
      },
      "/api/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Current user" },
            401: { description: "JWT missing or invalid", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
          }
        }
      },
      "/api/workouts": {
        get: {
          tags: ["Workouts"],
          summary: "List the authenticated user's workouts",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["date_desc", "date_asc", "calories_desc", "duration_desc"], default: "date_desc" } }
          ],
          responses: { 200: { description: "Workout history" }, 401: { description: "JWT missing or invalid" } }
        },
        post: {
          tags: ["Workouts"],
          summary: "Create a workout for the authenticated user",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/WorkoutRequest" } } }
          },
          responses: { 201: { description: "Workout created" }, 400: { description: "Validation error" }, 401: { description: "JWT missing or invalid" } }
        }
      },
      "/api/workouts/{id}": {
        put: {
          tags: ["Workouts"],
          summary: "Update one of the authenticated user's workouts",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WorkoutRequest" } } } },
          responses: { 200: { description: "Workout updated" }, 404: { description: "Workout not found" } }
        },
        delete: {
          tags: ["Workouts"],
          summary: "Delete one of the authenticated user's workouts",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Workout deleted" }, 404: { description: "Workout not found" } }
        }
      },
      "/api/gamification/summary": {
        get: {
          tags: ["Gamification"],
          summary: "Get XP, level, streak, and badges for the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Gamification summary" }, 401: { description: "JWT missing or invalid" } }
        }
      },
      "/api/gamification/checkin": {
        post: {
          tags: ["Gamification"],
          summary: "Create today's check-in",
          security: [{ bearerAuth: [] }],
          requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CheckinRequest" } } } },
          responses: { 201: { description: "Check-in created" }, 400: { description: "Already checked in or validation error" }, 401: { description: "JWT missing or invalid" } }
        }
      },
      "/api/admin/stats": {
        get: {
          tags: ["Admin"],
          summary: "Get dashboard statistics (admin only)",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Admin dashboard statistics" }, 401: { description: "JWT missing or invalid" }, 403: { description: "Admin role required" } }
        }
      },
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List users (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "role", in: "query", schema: { type: "string", enum: ["user", "admin"] } },
            { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive"] } }
          ],
          responses: { 200: { description: "User list" }, 401: { description: "JWT missing or invalid" }, 403: { description: "Admin role required" } }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
