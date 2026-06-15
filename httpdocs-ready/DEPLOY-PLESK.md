# Plesk Deploy — ER:LC CAD / MDT

## PHP + MySQL (default on Plesk)

This build includes a **PHP CAD API** at `api/cad/` — no Node.js required.

### One-time setup

1. Git deploy (or upload `httpdocs-ready` contents to httpdocs)
2. Copy `database/plesk.local.example.php` → `database/plesk.local.php`
3. Paste your Plesk database password into `plesk.local.php`
4. Import `database/install-all.sql` via phpMyAdmin (if not done already)
5. Delete `api/install-cad-db.php` after setup

### Verify

- `GET /api/health` → `{"ok":true,"mode":"cad","database":"connected"}`
- Dev login: **admin** / **admin123** (disable with `dev_login => false` in plesk.local.php)

### Optional: Node.js

For Discord OAuth and the full Express server, enable Node.js with startup `app.js`.
See `CAD-SETUP.md` in the project root.
