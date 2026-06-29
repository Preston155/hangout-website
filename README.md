# PrestonHQ Profiles

Production SaaS foundation for a multi-user link-in-bio/profile builder.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Auth.js / NextAuth credentials auth
- Stripe-ready subscription model

## Routes

- `/` landing page
- `/signup`, `/login`
- `/dashboard`
- `/explore`
- `/@username` public profile URLs, rewritten internally to `/u/username`
- `/admin`
- `/api/*` future mobile-app-ready API routes

## Setup

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

For production, set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, SMTP, and Stripe env vars.
