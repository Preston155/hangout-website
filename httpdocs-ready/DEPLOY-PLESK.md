# Plesk Deploy — ER:LC CAD / MDT

## Node.js required

This CAD system runs on **Node.js + MySQL**, not PHP alone.

### Setup on Plesk

1. Upload the full project (or use Git deploy)
2. Enable **Node.js** → startup file: `app.js`
3. Set environment variables from `.env.example`
4. Create MySQL database → run `npm run db:init` or import `database/schema.sql`
5. Run `npm install` and restart Node.js app

### Static-only folder (this httpdocs-ready build)

This folder contains the **frontend static files** only.
The API (`/api/*`) and auth (`/auth/*`) routes are served by the Node.js app.

For production, deploy the **full repo** with Node.js enabled — not just this folder.

### Verify

- `GET /api/health` → `{"ok":true,"mode":"cad","database":"connected"}`
- Login at `/` with Discord or dev credentials

See `CAD-SETUP.md` in the project root for full instructions.
