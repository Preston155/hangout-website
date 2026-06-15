# Using your existing Plesk database (prestonhq.com)

You already have **prestonh_database** on MariaDB — perfect. The CAD will use that database; you do **not** need to create a new one.

## Step 1 — Import CAD tables (phpMyAdmin)

1. In Plesk → **Databases** → click **phpMyAdmin** on `prestonh_database`
2. Select database **prestonh_database** in the left sidebar
3. Click **Import**
4. Upload **`database/schema-tables.sql`** from this project
5. Click **Go**
6. Import again with **`database/seed-tables.sql`** (departments, ranks, default config)

You should end up with ~16 CAD tables (plus whatever table was already there).

> If the old single table is unused, you can leave it or drop it in phpMyAdmin — CAD tables use different names (`users`, `calls`, `departments`, etc.).

## Step 2 — Node.js environment variables (Plesk)

In Plesk → **Node.js** → your app → **Environment variables**, set:

| Variable | Value |
|----------|--------|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | `prestonh_database` |
| `DB_PASSWORD` | *(from Plesk → Connection info)* |
| `DB_NAME` | `prestonh_database` |
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | *(long random string)* |
| `DEV_LOGIN` | `false` *(or `true` temporarily for admin setup)* |
| `SERVER_NAME` | `Liberty County CAD` |
| `DISCORD_CALLBACK_URL` | `https://prestonhq.com/auth/discord/callback` |

Get the password from **Connection info** on the database screen (same place as your screenshot).

## Step 3 — Verify connection

After Node.js app is running, open:

```
https://prestonhq.com/api/health
```

Expected:

```json
{"ok":true,"mode":"cad","database":"connected"}
```

If `"database":"disconnected"`, double-check `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in Plesk Node.js settings.

## Step 4 — First admin user

**Option A — Dev login (temporary)**  
Set `DEV_LOGIN=true` on Plesk, restart Node.js, visit the site, sign in with `admin` / `admin123`. The app creates the admin user automatically.

**Option B — Discord OAuth**  
Configure Discord app credentials and log in with Discord; assign admin role in Admin Panel.

## Local testing with the same database

You usually **cannot** connect to Plesk MariaDB from your PC (localhost only on server). For local dev, use a local MySQL database or SSH tunnel. On the **server**, the CAD and database are on the same machine — that's the normal Plesk setup.
