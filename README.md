# ❤️ Kokoro March

### Find love. Share moments. Build forever.

A modern African dating & relationship platform — compatibility-first matching,
real-time chat, safety controls, premium subscriptions and an admin console.

**Stack**

| Layer       | Technology                                                        |
| ----------- | ----------------------------------------------------------------- |
| Frontend    | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, Socket.IO client |
| Backend     | NestJS 10, TypeScript, REST + Socket.IO, JWT auth, class-validator |
| Database    | MySQL 8 / MariaDB (TypeORM, migrations) — SQLite dev fallback     |
| Media       | Cloudinary (optional; local disk fallback)                        |
| Realtime    | Socket.IO (messages, typing, presence, notifications, match events) |

The frontend talks to the backend over REST + websockets and works across
desktop, tablet and mobile. Everything persists in the database — no fake data,
no hardcoded users.

---

## Quick start (local development)

You need **Node.js 20+**. The backend ships with a zero-setup SQLite mode so you
can run the whole stack without installing MySQL.

```bash
# 1. Backend
cd backend
cp .env.example .env          # defaults are fine for dev
npm install
npm run seed                  # creates schema + 12 demo profiles + admin
npm run start:dev             # API + websockets on http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Open **http://localhost:3000**.

### Demo accounts

| Role  | Email                    | Password      |
| ----- | ------------------------ | ------------- |
| User  | `vanessa@kokoro.test`    | `Password123` |
| User  | `amara@kokoro.test`      | `Password123` |
| Admin | `admin@kokoro.test`      | `Admin123!`   |

(12 seeded profiles across Lagos, Accra, Johannesburg, Nairobi, Yaoundé, Dakar…)

### End-to-end test journey

1. Log in as `vanessa@kokoro.test` in one browser and `amara@kokoro.test` in
   another (or an incognito window).
2. Both have completed profiles and appear in **Discover**.
3. Vanessa likes Amara; Amara likes Vanessa → **It’s a Match** modal for both.
4. Open the conversation and chat — messages, typing indicators and read
   receipts arrive in real time.
5. Try block/report, premium subscribe, and the admin console.

A scripted backend smoke test (register → onboarding → discover → mutual like →
match → message → block → report → admin → premium) is in
`backend/e2e-smoke.sh`, and a Socket.IO realtime test in
`backend/realtime-test.js` (run with `NODE_PATH=../frontend/node_modules`).

---

## Running with MySQL (production-like)

1. Create a database:
   ```sql
   CREATE DATABASE kokoro_march CHARACTER SET utf8mb4;
   CREATE USER 'kokoro'@'%' IDENTIFIED BY 'strong-password';
   GRANT ALL ON kokoro_march.* TO 'kokoro'@'%';
   ```
2. Set in `backend/.env`:
   ```env
   DB_TYPE=mysql
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_NAME=kokoro_march
   DATABASE_USER=kokoro
   DATABASE_PASSWORD=strong-password
   DB_SYNCHRONIZE=false
   ```
3. Apply migrations, then seed:
   ```bash
   npm run migration:run
   npm run seed
   ```

A `docker-compose.yml` is provided for a one-command MySQL:
`docker compose up -d db`.

---

## Environment variables

**Backend (`backend/.env`)** — see `.env.example` for all keys:

- `PORT`, `FRONTEND_URL` (CORS), `DB_TYPE` (`mysql` | `sqlite`), `DATABASE_*`,
  `DB_SYNCHRONIZE`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (+ expiry)
- `CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET` (optional; media falls back to
  local disk + `/media`)
- `PAYMENT_PROVIDER` (mock for now)

**Frontend (`frontend/.env.local`)**:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

---

## Feature overview

- **Auth** — register/login (JWT access + rotating refresh tokens), password
  reset flow, email-verification architecture, bcrypt hashing, 18+ enforcement.
- **Onboarding** — basics, photo, bio + intention, multi-select interests,
  dating preferences; profile-completion percentage.
- **Discovery** — swipe deck with like / pass / super like / undo / profile /
  report / block; filters; distance & gender/age preferences; boosted profiles
  surface first.
- **Matching** — real mutual-like detection creates a match, a conversation and
  dual notifications + match animation. No fake matches.
- **Compatibility** — transparent scoring (interests 35, goals 25, preferences
  20, location 10, profile/activity 10) with a breakdown, human-readable
  reasons and conversation starters. Built behind a service so an AI/ML
  recommender can re-rank without touching matching.
- **Chat** — Socket.IO DMs between matches: text, image & voice messages,
  typing indicator, presence, delivered/read receipts, unread counts, delete,
  conversation search. Messages persist in MySQL.
- **Likes & Matches** — received/sent likes (privacy-blurred for free users),
  matches grid with compatibility and last activity, unmatch.
- **Safety** — block (mutual exclusion from discovery/messages), report with
  reasons (auto-blocks), verification request queue, granular privacy settings.
- **Premium** — plans, subscription entitlements (unlimited likes, see-who-
  liked-you, super likes, boosts, advanced filters, rewinds), payment-provider
  abstraction (mock; webhook-ready for MTN MoMo / Orange Money / Paystack).
- **Admin** — live stats cards, growth/engagement charts, user moderation,
  report queue, verification approvals, payments.
- **Media** — Cloudinary uploads with a local-disk fallback; only URLs live in
  the DB.

### Voice & video calls

The signaling architecture is in place (authenticated Socket.IO gateway +
per-match conversation rooms) so WebRTC call signalling can be added without
rewriting the app; call buttons are intentionally not shown until the media
plane is wired.

---

## Deployment

```
                    KOKORO MARCH
                          │
             ┌────────────┴────────────┐
             │                         │
        Next.js Frontend          NestJS Backend
        (Vercel)                  (Render / Railway / Fly)
             │                         │
             └─────── HTTPS + WSS ─────┘
                                       │
                         ┌─────────────┼─────────────┐
                       MySQL       Socket.IO     Cloudinary
                    (managed DB)     (same app)      Media
```

**Backend (Render)**: create a Web Service from `backend/`, build `npm install
&& npm run build`, start `npm run migration:run && npm run seed && npm run
start`. Add the env vars above; set `FRONTEND_URL` to the Vercel URL (CORS).

**Frontend (Vercel)**: import `frontend/`, set `NEXT_PUBLIC_API_URL` to the
Render `…/api` URL and `NEXT_PUBLIC_SOCKET_URL` to the Render root (no `/api`).
WSS is used automatically in production.

> The backend enables CORS for the exact `FRONTEND_URL` origin and the
> Socket.IO gateway uses the same allow-list, so users on different networks
> and devices can chat.

## Project structure

```
backend/src/
  auth users profiles preferences interests discovery likes matches
  conversations messages notifications blocks reports media premium
  payments admin recommendations common seed database
frontend/src/
  app/            # (auth), onboarding, app/*, admin/* routes
  components/     # design system + feature components
  lib/            # api client, socket provider, store, types
```
