# Backend Tests

Lightweight example tests using Node's built-in test runner (`node --test`).
No extra dependencies and **no database required** — they exercise the
security-critical logic in isolation.

## Run

```bash
cd backend
npm test
```

## What is covered

- **`auth.test.js`** — registration/login security:
  - bcrypt hashing round-trip (password is never stored in plain text; correct
    password verifies, wrong password fails).
  - request validation: rejects invalid email and short (<8 char) passwords,
    accepts valid input, and normalizes the email (trim + lowercase).
- **`ownership.test.js`** — authorization / data isolation:
  - a user cannot **edit** another user's workout (service returns 404),
  - a user cannot **delete** another user's workout, and the acting user id is
    forwarded into the user-scoped SQL delete (`WHERE id = ? AND user_id = ?`),
  - a user cannot **delete** another user's weight (progress) log.

## Notes for fuller (integration) testing

The example above tests logic without a DB. To test the live API end to end
(with MySQL running on port 8889 and the backend on `:5000`), use curl, Postman,
or a tool like `supertest`. Example manual checks:

```bash
# Register
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo","email":"demo@fitsync.com","password":"password123"}'

# Login (capture the token from the response)
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@fitsync.com","password":"fitness123"}'

# Authenticated request
curl -s http://localhost:5000/api/workouts -H "Authorization: Bearer <TOKEN>"

# Ownership: deleting a workout id that belongs to another user returns 404
curl -s -X DELETE http://localhost:5000/api/workouts/<OTHER_USERS_ID> \
  -H "Authorization: Bearer <TOKEN>"
```
