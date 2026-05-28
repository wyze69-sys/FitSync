# FitSync Security Audit Report

**Audit Date:** May 28, 2026  
**Auditor:** Security Review (Automated + Manual)  
**Repository:** wyze69-sys/FitSync  
**Stack:** React + Vite | Node.js + Express | MySQL (mysql2/promise) | JWT | bcrypt | Gemini AI

---

## A. Executive Summary

**Overall Security Status: Needs Minor Fixes**

The FitSync codebase demonstrates solid foundational security practices. All SQL queries use parameterized statements, passwords are hashed with bcrypt, JWT authentication is properly structured, admin routes are backend-protected, and secrets are correctly kept out of version control. However, several medium-priority issues exist that should be addressed — most critically, the ability for any user to self-register as an admin, a hardcoded JWT fallback secret, and overly permissive CORS configuration. All identified issues can be fixed with small, targeted changes.

---

## B. Critical Issues

### B1. Users Can Self-Assign Admin Role During Registration

| Field | Details |
|-------|---------|
| **File** | `backend/src/controllers/authController.js` (line ~22) |
| **Issue** | The register endpoint accepts a `role` field from the request body and assigns `"admin"` if provided |
| **Code** | `const assignedRole = role === "admin" ? "admin" : "user";` |
| **Why it matters** | Any unauthenticated user can create an admin account by sending `{ "role": "admin" }` in the registration request body. This completely bypasses authorization controls. |
| **How to fix** | Remove the `role` field from destructuring in the register handler. Always force `role = "user"` for self-registration. Admin accounts should only be created through database seeding or by an existing admin. |

### B2. Hardcoded JWT Fallback Secret

| Field | Details |
|-------|---------|
| **File** | `backend/src/config/jwt.js` |
| **Issue** | `secret: process.env.JWT_SECRET \|\| "change_this_secret"` provides a known fallback |
| **Why it matters** | If the environment variable is missing or misconfigured, tokens are signed with a publicly known secret, allowing anyone to forge valid JWT tokens. |
| **How to fix** | Remove the fallback. The `server.js` already validates `JWT_SECRET` exists at startup — so the fallback is unreachable but dangerous if startup checks are bypassed. Throw an error if `JWT_SECRET` is not set. |

---

## C. Medium Issues

### C1. CORS Allows All Origins

| Field | Details |
|-------|---------|
| **File** | `backend/app.js` (line 7) |
| **Issue** | `app.use(cors({ origin: true, credentials: true }))` reflects any origin |
| **Why it matters** | In production, this allows any website to make authenticated cross-origin requests to the API, potentially enabling CSRF-like attacks via JavaScript. |
| **How to fix** | Use an environment variable for allowed origins: `origin: process.env.CORS_ORIGIN \|\| "http://localhost:5173"`. For development, keep permissive; for production, restrict to the deployed frontend domain. |

### C2. No Password Length/Complexity Validation

| Field | Details |
|-------|---------|
| **File** | `backend/src/controllers/authController.js` |
| **Issue** | Registration accepts any password string (even 1 character) |
| **Why it matters** | Users may set extremely weak passwords that are trivially guessable or brute-forced. |
| **How to fix** | Add minimum password length validation (at least 6-8 characters) before hashing. |

### C3. No Email Format Validation

| Field | Details |
|-------|---------|
| **File** | `backend/src/controllers/authController.js` |
| **Issue** | The email field is only checked for existence (`!email`), not format |
| **Why it matters** | Invalid email strings can be stored in the database, causing issues with data integrity and potential injection patterns. |
| **How to fix** | Add a basic email regex check (e.g., `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). |

### C4. No Rate Limiting on Auth Endpoints

| Field | Details |
|-------|---------|
| **File** | `backend/src/routes/authRoutes.js` |
| **Issue** | Login and register endpoints have no request rate limiting |
| **Why it matters** | Attackers can brute-force passwords or flood registration with automated requests. |
| **How to fix** | Add `express-rate-limit` middleware to `/api/auth/login` and `/api/auth/register` routes. |

### C5. No Security Headers (Helmet)

| Field | Details |
|-------|---------|
| **File** | `backend/app.js` |
| **Issue** | No HTTP security headers are set (X-Content-Type-Options, X-Frame-Options, etc.) |
| **Why it matters** | Missing headers leave the application vulnerable to clickjacking, MIME-sniffing, and other browser-based attacks. |
| **How to fix** | Add `helmet` middleware: `app.use(helmet())`. It is safe and non-breaking. |

### C6. Error Handler May Leak Internal Details

| Field | Details |
|-------|---------|
| **File** | `backend/app.js` (lines 22-26) |
| **Issue** | `res.status(err.status \|\| 500).json({ error: err.message \|\| "Internal server error." })` |
| **Why it matters** | In production, `err.message` may contain SQL errors, file paths, or stack trace fragments that help attackers understand the system. |
| **How to fix** | For 500 errors, always return a generic message. Only pass `err.message` for known/expected errors (4xx status codes). |

### C7. Database Privileges Script Grants ALL PRIVILEGES

| Field | Details |
|-------|---------|
| **File** | `database/privileges.sql` |
| **Issue** | `GRANT ALL PRIVILEGES ON fitsync_db.* TO 'fitsync_user'@'localhost'` |
| **Why it matters** | The application user gets DROP, ALTER, CREATE, and GRANT permissions it doesn't need. If SQL injection were found, the damage surface is maximized. |
| **How to fix** | Grant only `SELECT, INSERT, UPDATE, DELETE` for the application user. |

### C8. Weak Hardcoded Password in privileges.sql

| Field | Details |
|-------|---------|
| **File** | `database/privileges.sql` |
| **Issue** | `IDENTIFIED BY 'fitsync_password'` is a weak, known password |
| **Why it matters** | Anyone reading the repository knows the database password. |
| **How to fix** | Replace with a placeholder comment instructing the user to set a strong password, or reference an environment variable. |

---

## D. Low Issues / Improvements

### D1. ID Generation Uses Math.random()

| Field | Details |
|-------|---------|
| **File** | `backend/src/utils/ids.js` |
| **Issue** | `Math.random().toString(36).slice(2, 11)` is not cryptographically secure |
| **Suggestion** | For a course project this is acceptable, but for production use `crypto.randomUUID()` or `crypto.randomBytes()`. IDs are not secret tokens, so this is low priority. |

### D2. Token Stored in localStorage

| Field | Details |
|-------|---------|
| **File** | `frontend/src/App.jsx` |
| **Issue** | JWT token is stored in `localStorage` rather than an httpOnly cookie |
| **Suggestion** | For this project scope, this is acceptable. In production, httpOnly cookies with SameSite=Strict would be more secure against XSS. No change needed for course project. |

### D3. Seed Bootstrap Uses Weak Demo Passwords

| Field | Details |
|-------|---------|
| **File** | `backend/src/utils/bootstrap.js` |
| **Issue** | Demo users use passwords "admin123" and "fitness123" |
| **Suggestion** | Acceptable for a course evaluation project with demo credentials. Add a comment noting these are for development only. |

### D4. Request Body Size Limit Could Be Tighter

| Field | Details |
|-------|---------|
| **File** | `backend/app.js` |
| **Issue** | `express.json({ limit: "1mb" })` — 1MB is generous for this API |
| **Suggestion** | Consider reducing to `"100kb"` which is more than sufficient for all endpoints. |

### D5. No Input Length Limits on Text Fields

| Field | Details |
|-------|---------|
| **Files** | Various controllers (workout title, notes, category name/description) |
| **Issue** | No server-side maximum length validation on string inputs |
| **Suggestion** | Add length checks (e.g., title max 255 chars, notes max 2000 chars) to prevent database errors and potential abuse. |

### D6. Gemini AI Prompt Contains User Personal Data

| Field | Details |
|-------|---------|
| **File** | `backend/src/services/aiService.js` |
| **Issue** | User name, age, gender, weight, and goal are sent to Gemini API |
| **Suggestion** | This is necessary for personalized insights. The data sent is minimal and appropriate. Consider adding a privacy note in documentation. No code change needed. |

---

## E. Positive Findings

The following security practices are already correctly implemented:

1. **Parameterized SQL queries** — All database queries use `pool.execute()` with `?` placeholders. No string concatenation in SQL. Zero SQL injection risk in current code.

2. **Password hashing with bcrypt** — Registration properly hashes passwords with `bcryptjs.hashSync(password, 10)`. Login uses `bcryptjs.compareSync()`.

3. **Passwords never returned in API responses** — All endpoints destructure `{ passwordHash: ignored, ...userSafe }` before sending responses.

4. **JWT authentication middleware** — Proper Bearer token extraction, verification, and error handling. Applied to all protected routes.

5. **Admin route protection** — All `/api/admin/*` routes use both `authenticateToken` AND `requireAdmin` middleware at the backend level.

6. **User data isolation** — Workout and weight controllers verify `userId` ownership before allowing updates/deletes. Users cannot access other users' data.

7. **Secrets excluded from version control** — `.gitignore` properly ignores `.env`, `.env.*`, `*.pem`, `*.key`, and `secrets/` directories.

8. **.env.example contains only placeholders** — No real secrets, API keys, or passwords are committed.

9. **Frontend never calls Gemini API directly** — All AI logic is backend-only. API key is server-side only.

10. **JWT token expiry** — Tokens expire after 7 days (`expiresIn: "7d"`).

11. **Database foreign keys with CASCADE** — Proper referential integrity. Deleting a user cascades to their workouts, weight logs, and insights.

12. **Database transactions for multi-table inserts** — Workout creation uses `beginTransaction/commit/rollback` for atomicity.

13. **Environment variable validation at startup** — `server.js` validates all required env vars before starting the server.

14. **Logout clears all auth state** — Frontend removes token from localStorage and resets all state.

15. **404 handler exists** — Unknown routes return clean JSON `{ error: "Route not found." }`.

16. **AI output is treated as text** — Gemini responses are rendered as text content in React (not dangerouslySetInnerHTML).

17. **AI includes disclaimer** — The WeeklyInsightsView includes a note that insights are "for fitness educational and lifestyle target optimization support only, and does not serve as clinical advice."

---

## F. Recommended Fix Plan

### Step 1: Critical — Block Admin Self-Registration (Priority: Immediate)
Remove `role` from the registration request body. Force all self-registered users to `role = "user"`.

### Step 2: Critical — Remove JWT Fallback Secret (Priority: Immediate)
Remove the `"change_this_secret"` fallback in `jwt.js`. Throw an error if the secret is not configured.

### Step 3: Medium — Add Input Validation (Priority: High)
- Add email format validation with regex
- Add minimum password length (8 characters)
- Add string length limits for text fields

### Step 4: Medium — Improve CORS Configuration (Priority: High)
Replace `origin: true` with environment-based origin whitelist.

### Step 5: Medium — Add Security Middleware (Priority: High)
- Install and configure `helmet` for HTTP security headers
- Install and configure `express-rate-limit` for auth endpoints

### Step 6: Medium — Improve Error Handling (Priority: Medium)
Return generic error messages for 500 errors in production. Only pass through messages for expected/handled errors.

### Step 7: Low — Update Database Privileges (Priority: Medium)
Replace `ALL PRIVILEGES` with `SELECT, INSERT, UPDATE, DELETE` in `privileges.sql`. Replace hardcoded password with a placeholder instruction.

### Step 8: Low — Reduce Request Body Limit (Priority: Low)
Change `express.json({ limit: "1mb" })` to `express.json({ limit: "100kb" })`.

---

## G. Dependencies Assessment

### Backend (`backend/package.json`)
| Package | Version | Status |
|---------|---------|--------|
| express | ^4.21.2 | Current, no known critical CVEs |
| bcryptjs | ^3.0.3 | Current, secure hashing library |
| jsonwebtoken | ^9.0.3 | Current |
| mysql2 | ^3.15.3 | Current |
| dotenv | ^17.2.3 | Current |
| cors | ^2.8.5 | Current |
| @google/genai | ^2.4.0 | Current |
| nodemon (dev) | ^3.1.10 | Dev only, safe |

**Recommendation:** Run `npm audit` periodically. Add `helmet` and `express-rate-limit` as new dependencies.

### Frontend (`frontend/package.json`)
| Package | Version | Status |
|---------|---------|--------|
| react | ^19.0.1 | Current |
| react-dom | ^19.0.1 | Current |
| vite | ^6.2.3 | Current |
| lucide-react | ^0.546.0 | Current |
| tailwindcss | ^4.1.14 | Current |
| motion | ^12.23.24 | Current |

**Assessment:** All frontend dependencies are standard, current, and appropriate. No unnecessary or risky packages detected.

---

*End of Security Audit Report*
