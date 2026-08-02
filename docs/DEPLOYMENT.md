# Deployment Guide

## Local development

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run db:push`.
6. Run `npm run dev`.

## Docker

Use `docker compose up --build` for local production-style testing.

## Production

1. Set all environment variables on the host.
2. Run database migrations.
3. Build with `npm run build`.
4. Start with `npm run start`.
5. Put the app behind HTTPS.
6. Restrict the POS subdomain to trusted employees/network where possible.

## Backup and restore

- Back up PostgreSQL daily.
- Store backups outside the application server.
- Test restore procedures monthly.
- Keep printer and POS settings documented separately from secrets.
