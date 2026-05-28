# FitSync

FitSync is a React.js + Vite frontend with a Node.js + Express.js backend and a MySQL database.

## Requirements

- Node.js
- MySQL or MAMP MySQL running on port `8889`
- Database name: `fitsync_db`

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on Vite and proxies `/api` requests to the backend on port `5000`.

## Database

MySQL files are in `database/`:

- `schema.sql`
- `seed.sql`
- `queries.sql`
- `privileges.sql`
- `backup-notes.md`
