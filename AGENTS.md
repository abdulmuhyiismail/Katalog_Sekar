# Katalog Sekar

Monorepo with two packages: `client/` (Vite + React 19) and `server/` (Node/Express + SQLite).

## Commands

- Client dev: `cd client && npm run dev` (port 3000, proxies `/api` and `/uploads` to `localhost:5000`)
- Client lint: `cd client && npm run lint` (oxlint)
- Client build: `cd client && npm run build`
- Server dev (placeholder): `cd server && npm run dev` runs `node server.js` on port 3000 — NOT the real API

## Server gotchas

- The real API lives in `server/src/index.js` (ESM), but `server/package.json` declares `"type": "commonjs"` and `scripts.dev` points at the stub `server.js`. Running `npm run dev` does not start the API.
- `src/index.js` imports `./routes/category.js` and `./routes/product.js`, but the actual files are `categories.js` and `products.js` — fix these paths before running.
- API expects Node >= 22.5 (uses `node:sqlite` `DatabaseSync`).
- DB is `server/src/db/katalogwa.sqlite`, seeded once from `server/src/db/data.json` only when tables are empty. Delete the sqlite file to re-seed.
- Server port from `PORT` env (default 5000); client proxy targets 5000.

## Conventions

- No tests exist (`npm test` is a stub).
- Uploads served at `/uploads` from `server/src/../uploads` (i.e. `server/uploads`).
- Root `.gitignore` ignores `node_modules/`, `package-lock.json/`, `.env/`.