# FitTrack

FitTrack is a personal wellness tracker for movement, hydration, and sleep. Log everyday activity, set daily goals, and review a weekly dashboard with charts and an activity streak.

## Features

- Email/password registration and login with bcrypt hashes and JWT sessions.
- Walk logs for steps and distance, water logs with quick-add actions, and sleep logs with a quality rating.
- Per-user activity history with edit and delete actions.
- Weekly steps, water, and sleep charts, progress summaries, daily goals, and an activity streak.
- Editable goals, defaulting to 8,000 steps, 2,000 ml water, and 8 hours of sleep per day.
- Responsive navigation, accessible forms, loading and empty states, and toast feedback.
- PostgreSQL persistence with Prisma, shared Zod validation, and Vitest coverage.

## Tech Stack

Next.js 16 App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Auth.js / NextAuth Credentials, Recharts, Zod, Vitest, ESLint, and Prettier. Deployable to Vercel.

## Screenshots

Dashboard screenshot placeholder. Replace this section with a capture from the running app.

## Local Setup

Requirements: Node.js 20.9 or newer, npm, and a PostgreSQL database. Neon and Supabase offer hosted PostgreSQL options.

1. Install dependencies and create a local environment file:

   ```bash
   npm install
   cp .env.example .env
   openssl rand -base64 32
   ```

2. Set the generated value as `NEXTAUTH_SECRET`, configure `DATABASE_URL`, and use `http://localhost:3000` for `NEXTAUTH_URL` locally.
3. Apply the migrations, add the demo account and sample activity, and start the app:

   ```bash
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The seed is repeatable and replaces the demo account's activity entries with two weeks of sample data.

After creating `.env`, the complete setup sequence is `npm install && npx prisma migrate dev && npm run seed && npm run dev`.

## Environment Variables

| Variable          | Description                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection URL; use SSL settings for hosted databases. |
| `NEXTAUTH_SECRET` | Random secret used to sign and encrypt JWT sessions.              |
| `NEXTAUTH_URL`    | Canonical app URL, such as `http://localhost:3000` locally.       |

See [.env.example](.env.example) for the expected format. Never commit local or production secrets.

## Demo Login

- Email: `demo@fitness.app`
- Password: `Demo1234!`

## Tests

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Unit tests do not require PostgreSQL. Account registration, login, logs, and seeded dashboard data do require a reachable database.

## Deploy to Vercel

1. Create a PostgreSQL database with Neon or Supabase. Use a pooled runtime URL where appropriate; use a direct or session-mode connection URL for Prisma migrations.
2. Import the repository into Vercel and configure `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` for the deployed environment. Set `NEXTAUTH_URL` to the app origin (for example, `https://your-app.vercel.app`) without a trailing slash.
3. Before the first deployment, apply committed migrations to the production database with a direct migration connection:

   ```bash
   DATABASE_URL="your-production-migration-url" npx prisma migrate deploy
   ```

   Repeat this step for releases that add migrations. Vercel builds generate the Prisma Client and compile the app; they do not modify the production database.

4. Deploy from Vercel. The `postinstall` script runs `prisma generate`, and the build script generates the client before `next build`.
5. Optionally run `npm run seed` against a non-production database for the demo account and sample data. Do not seed production unless you explicitly want the demo account there.

## API Routes

- `POST /api/auth/register` creates an account. NextAuth serves the remaining `/api/auth/*` handlers.
- `GET` and `POST /api/logs` list and create activity entries.
- `PATCH` and `DELETE /api/logs/[id]` update and delete entries owned by the signed-in user.
- `GET /api/stats/weekly?start=YYYY-MM-DD` returns seven daily summaries, goals, and weekly metrics.
- `GET` and `PATCH /api/user/goals` read and update the signed-in user's daily goals.

Unauthenticated private API requests receive a JSON `401`. Log queries and mutations are scoped to the authenticated user's ID.
