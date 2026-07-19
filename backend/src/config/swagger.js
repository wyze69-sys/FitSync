const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "FitSync API",
    version: "1.0.0",
    description:
      "Interactive documentation for selected FitSync API demonstration endpoints. Log in first, copy the returned JWT, then select Authorize and paste only the token."
  },
  servers: [
    {
      url: "/",
      description: "Current FitSync server"
    }
  ],
  tags: [
    { name: "System", description: "API availability" },
    { name: "Authentication", description: "Registration, login, and current user" },
    { name: "Workouts", description: "Workout history and logging" },
    { name: "Gamification", description: "XP, levels, streaks, and check-ins" },
    { name: "Admin", description: "Administrator-only operations" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste only the JWT token returned by POST /api/auth/login."
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string", example: "Invalid email or password." }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "student@example.com" },
          password: { type: "string", format: "password", example: "Password123" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "LINH RATH HENRY" },
          email: { type: "string", format: "email", example: "newstudent@example.com" },
          password: { type: "string", format: "password", minLength: 8, example: "Password123" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "usr_123" },
          email: { type: "string", format: "email", example: "student@example.com" },
          name: { type: "string", example: "LINH RATH HENRY" },
          role: { type: "string", enum: ["user", "admin"], example: "user" }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string", description: "JWT used with the Authorize button", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
        }
      },
      WorkoutRequest: {
        type: "object",
        required: ["date", "title", "durationMin"],
        properties: {
          date: { type: "string", format: "date", example: "2026-07-16" },
          title: { type: "string", example: "Morning Run" },
          categorySlug: { type: "string", example: "cardio" },
          activitySlug: { type: "string", example: "running" },
          durationMin: { type: "number", minimum: 1, example: 30 },
          distanceKm: { type: "number", minimum: 0, example: 3 },
          notes: { type: "string", example: "Swagger API demonstration" }
        }
      },
      CheckinRequest: {
        type: "object",
        properties: {
          type: { type: "string", example: "Wellness check-in" }
        }
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Check whether the FitSync API is running",
        operationId: "getApiHealth",
        responses: {
          200: {
            description: "FitSync API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    service: { type: "string", example: "FitSync API" },
                    timestamp: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Create a local user account",
        operationId: "registerUser",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } }
          }
        },
        responses: {
          201: {
            description: "Account created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } }
          },
          400: {
            description: "Validation error or email already registered",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          },
          500: {
            description: "Unexpected server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in and receive a JWT",
        operationId: "loginUser",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } }
          }
        },
        responses: {
          200: {
            description: "Login successful",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } }
          },
          400: {
            description: "Invalid request body",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          },
          401: {
            description: "Invalid email or password",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          },
          500: {
            description: "Unexpected server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the authenticated user",
        operationId: "getCurrentUser",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
          },
          401: {
            description: "JWT missing or invalid",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    },
    "/api/workouts": {
      get: {
        tags: ["Workouts"],
        summary: "List the authenticated user's workouts",
        operationId: "listWorkouts",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["date_desc", "date_asc", "calories_desc", "duration_desc"], default: "date_desc" } }
        ],
        responses: {
          200: { description: "Workout history" },
          401: { description: "JWT missing or invalid" }
        }
      },
      post: {
        tags: ["Workouts"],
        summary: "Create a workout",
        operationId: "createWorkout",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/WorkoutRequest" } } }
        },
        responses: {
          201: { description: "Workout created" },
          400: { description: "Validation error" },
          401: { description: "JWT missing or invalid" }
        }
      }
    },
    "/api/workouts/{id}": {
      put: {
        tags: ["Workouts"],
        summary: "Update one workout",
        operationId: "updateWorkout",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/WorkoutRequest" } } }
        },
        responses: { 200: { description: "Workout updated" }, 404: { description: "Workout not found" } }
      },
      delete: {
        tags: ["Workouts"],
        summary: "Delete one workout",
        operationId: "deleteWorkout",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Workout deleted" }, 404: { description: "Workout not found" } }
      }
    },
    "/api/gamification/summary": {
      get: {
        tags: ["Gamification"],
        summary: "Get XP, level, streak, and badges",
        operationId: "getGamificationSummary",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Gamification summary" }, 401: { description: "JWT missing or invalid" } }
      }
    },
    "/api/gamification/checkin": {
      post: {
        tags: ["Gamification"],
        summary: "Create today's check-in",
        operationId: "createDailyCheckin",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/CheckinRequest" } } }
        },
        responses: {
          201: { description: "Check-in created" },
          400: { description: "Already checked in or validation error" },
          401: { description: "JWT missing or invalid" }
        }
      }
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Get dashboard statistics",
        operationId: "getAdminStats",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Admin statistics" }, 401: { description: "JWT missing or invalid" }, 403: { description: "Admin role required" } }
      }
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List users",
        operationId: "listAdminUsers",
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
};

module.exports = { swaggerSpec };
