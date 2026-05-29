# FitSync Security Audit Report

**Stack:** React + Vite, Node.js + Express, MySQL, JWT, bcrypt, Gemini API

## Summary

FitSync implements the security controls expected for this project scope:

- All SQL uses parameterized `mysql2/promise` queries.
- Passwords are hashed with bcrypt before storage.
- JWT is required for protected routes; admin routes require both authentication
  and the admin role.
- Secrets are read from environment variables and are git-ignored.
- Gemini API access stays on the backend.

## Controls In Place

- **Authentication:** JWT (`utils/generateToken.js`), verified in
  `middleware/authMiddleware.js`. Self-registration always creates a `user`
  account; the `role` cannot be set from the request body.
- **Authorization:** `middleware/roleMiddleware.js` gates admin routes, which are
  additionally grouped behind `router.use(authenticateToken, requireAdmin)`.
- **Account status:** users can be deactivated; deactivated accounts are blocked
  at login (`403`).
- **Input validation:** centralized in `middleware/validate.js` with per-route
  schemas, including length limits on free-text fields (notes, descriptions) and
  bounds on numeric fields. Inputs are trimmed/sanitized before use.
- **Ownership checks:** workout and weight deletes are scoped with
  `AND user_id = ?` in SQL (defense in depth on top of service checks).
- **Rate limiting:** a global limiter protects all `/api` routes; a stricter
  limiter protects the auth endpoints.
- **Transport/headers:** Helmet is enabled; CORS is restricted via the
  `CORS_ORIGIN` environment variable; the JSON body limit is 100 kb.
- **Error handling:** server (5xx) errors return a generic message; only client
  (4xx) errors expose their message.
- **Database privileges:** `database/privileges.sql` grants only SELECT, INSERT,
  UPDATE, and DELETE to the application user.
- **Schema constraints:** `role` is an ENUM, and ownership relationships use
  `ON DELETE CASCADE` / `ON DELETE SET NULL` as appropriate.

## Current Notes

- Demo accounts use simple passwords for local course testing only.
- JWT is stored in `localStorage`, which is acceptable for this course project
  but less secure than httpOnly, SameSite cookies for production.
- Generated AI insights include basic profile, workout, and streak data, which
  is required for personalized weekly feedback.

## Recommended Future Improvements

- Use stronger demo credentials if deployed outside a local demo.
- Consider httpOnly SameSite cookies for JWT storage in production.
- Add automated endpoint tests covering auth, ownership, and admin guards.
- Run `npm audit` before submission and after dependency updates.
