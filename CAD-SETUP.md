# ER:LC CAD / MDT — Setup Guide

Professional Computer-Aided Dispatch and Mobile Data Terminal for **Emergency Response: Liberty County** roleplay servers.

## Requirements

- **Node.js** 18+
- **MySQL** 8.0+
- (Optional) **Discord Application** for OAuth login

## Quick Start (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
copy .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=erlc_cad
DEV_LOGIN=true
DEV_LOGIN_PASSWORD=admin123
SESSION_SECRET=change-this-to-something-random
```

### 3. Create the database

```bash
npm run db:init
```

Or manually:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p erlc_cad < database/seed.sql
```

### 4. Start the server

```bash
npm run dev
```

Open **http://localhost:3847**

### 5. Sign in

**Dev login** (when `DEV_LOGIN=true`):
- Username: `admin`
- Password: `admin123` (or your `DEV_LOGIN_PASSWORD`)

**Discord login** (optional):
1. Create an app at https://discord.com/developers/applications
2. Add redirect URL: `http://localhost:3847/auth/discord/callback`
3. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_CALLBACK_URL` in `.env`

## Modules

| Module | Role Required | Features |
|--------|--------------|----------|
| Dashboard | All | Stats, module shortcuts |
| Civilian Portal | civilian, admin | Characters, vehicles, 911 calls, records |
| Police MDT | police, admin | Name/plate search, citations, warrants, BOLOs, panic |
| Fire / EMS | fire, ems, admin | Medical calls, patient reports, transport |
| Dispatch | dispatch, admin | Calls, unit assignment, priorities, BOLOs |
| Admin Panel | admin | Users, departments, config, audit logs |

## Desktop App

The landing page includes an **Install Desktop App** button that downloads the existing desktop installer from `/downloads/`. Build it separately with:

```bash
npm run build:desktop
```

## Deploy to Plesk (Node.js)

1. Upload project files (exclude `node_modules`, `.git`)
2. Enable **Node.js** in Plesk → set startup file to `app.js`
3. Set environment variables from `.env` in Plesk Node.js settings
4. Create MySQL database in Plesk and import `database/schema.sql` + `database/seed.sql`
5. Set `NODE_ENV=production`, `DEV_LOGIN=false` in production
6. Restart the Node.js app

## API Health Check

```
GET /api/health
```

Returns `{ ok: true, mode: "cad", database: "connected" }` when MySQL is connected.

## Database Tables

`users`, `characters`, `vehicles`, `citations`, `warnings`, `arrests`, `warrants`, `bolos`, `calls`, `call_assignments`, `units`, `departments`, `ranks`, `patient_reports`, `audit_logs`, `server_config`

## Changing User Roles

1. Sign in as admin (dev login)
2. Go to **Admin Panel → Users**
3. Change role dropdown (police, fire, ems, dispatch, civilian, admin)
4. User must sign out and back in to see new modules

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `database: disconnected` | Check MySQL is running and `.env` credentials are correct |
| Dev login fails | Run server once with `DEV_LOGIN=true` — admin user is auto-created |
| Discord login redirects to error | Set Discord env vars or use dev login |
| 403 on modules | Admin must assign your user the correct role |
