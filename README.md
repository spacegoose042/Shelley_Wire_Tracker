# Shelley Electric – Wire Tracker

A simple web app for Shelley Electric (Wichita, Kansas) to track wire and parts pulled by technicians. Each pull records the user, part number(s), quantity, job name, and timestamp, and updates inventory.

## Features

- **Sign in** with work email and password (no Microsoft integration).
- **Record pull**: Enter job name, add one or more parts (type part number or scan barcode), enter quantity. Inventory is updated automatically.
- **Roles**: **Technician** (record pulls), **Admin** (manage parts, view transactions, manage users).
- **Admin – Parts**: Add parts (part number, description, unit: feet/each, initial quantity). Edit parts and adjust on-hand quantity.
- **Admin – Transactions**: View who pulled what and when.
- **Admin – Users**: Add users (email, password, name, role).

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- PostgreSQL with Prisma
- NextAuth.js (credentials only)
- Optional barcode scanning in the browser (camera)

## Local setup

1. **Clone and install**

   ```bash
   cd Shelley_Wire_Tracker
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – PostgreSQL connection string (e.g. local Postgres or a hosted DB).
   - `NEXTAUTH_SECRET` – random string (e.g. `openssl rand -base64 32`).
   - `NEXTAUTH_URL` – `http://localhost:3000` for local dev.

3. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

   Seed creates an admin user: **deb@shelleyelectric.com** with password **shelley-admin-1** (or set `ADMIN_INITIAL_PASSWORD` in `.env` before seeding).

4. **Logo**

   Place the Shelley Electric logo at `public/logo.png` so the login and header show it. If the file is missing, the app still runs but the image area may be empty.

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in with the seeded admin account.

## Deploying to Railway

1. Create a new project on [Railway](https://railway.app).
2. Add **PostgreSQL** from the catalog; note the `DATABASE_URL` in Variables.
3. Add a **Web Service** and connect your repo (or deploy from CLI).
4. Set environment variables:
   - `DATABASE_URL` – from the Postgres service.
   - `NEXTAUTH_SECRET` – generate a long random string.
   - `NEXTAUTH_URL` – your app URL (e.g. `https://your-app.up.railway.app`).
5. Build command: `npm run build` (or default).
6. Start command: `npm start`.
7. After first deploy, run migrations and seed from your machine (or a one-off command):

   ```bash
   DATABASE_URL="your-railway-database-url" npx prisma db push
   DATABASE_URL="your-railway-database-url" ADMIN_INITIAL_PASSWORD="your-password" npm run db:seed
   ```

   Or use Railway’s “Run command” / one-off job if available.

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm start` – run production server
- `npm run db:generate` – generate Prisma client
- `npm run db:push` – push schema to DB (no migrations)
- `npm run db:seed` – seed admin user (set `ADMIN_INITIAL_PASSWORD` to override default)
- `npm run db:studio` – open Prisma Studio

## License

Private – Shelley Electric.

---
*Small edit to test GitHub Desktop sync.*
