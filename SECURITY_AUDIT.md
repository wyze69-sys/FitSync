# FitSync Security Audit Report

**Review Date:** May 28, 2026
**Repository:** wyze69-sys/FitSync
**Stack:** React + Vite, Node.js + Express, MySQL, JWT, bcrypt, Gemini API

## Summary

FitSync has the main security controls expected for this project scope:

- SQL queries use parameterized `mysql2/promise` calls.
- Passwords are hashed with bcrypt before storage.
- JWT tokens are required for protected user routes.
- Admin routes are protected by both authentication and role checks.
- Secrets are read from environment variables and ignored by Git.
- Gemini API access stays on the backend.

The latest code already includes several fixes from the earlier audit, including forced `user` role during self-registration, no JWT fallback secret, stricter CORS configuration, Helmet security headers, auth rate limiting, and a smaller JSON body limit.

## Fixed Items

- Self-registration no longer accepts an admin role from the request body.
- `JWT_SECRET` is required and no hardcoded fallback secret is used.
- CORS uses the `CORS_ORIGIN` environment variable.
- `helmet` is enabled in the Express app.
- Auth endpoints use rate limiting.
- Server errors return a generic message instead of exposing internal details.
- `database/privileges.sql` grants only `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- `.env.example` contains placeholders instead of real secrets.

## Current Security Notes

- Demo accounts use simple passwords for course testing. These should not be used in production.
- JWT tokens are stored in `localStorage`, which is acceptable for this course project but less secure than httpOnly cookies for production.
- Generated AI insights include basic profile and workout data. This is required for personalized weekly feedback, but users should understand that Gemini is used for this feature.
- Input validation exists for auth fields. More length checks could be added later for workout notes, category descriptions, and other text fields.

## Recommended Improvements

- Use stronger demo credentials if the app is deployed outside a local demo.
- Add server-side length validation for all free-text fields.
- Consider httpOnly SameSite cookies for a production version.
- Run `npm audit` before submission and after dependency updates.
- Test basic auth, profile, workout, weight, AI insight, and admin endpoints before demo.
