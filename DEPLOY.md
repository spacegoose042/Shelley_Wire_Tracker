# Deploying Shelley Wire Tracker to GitHub + Railway

## 1. Push to GitHub

### Create a new repo on GitHub

1. Go to [github.com/new](https://github.com/new).
2. Repository name: `Shelley_Wire_Tracker` (or any name you prefer).
3. Choose **Private** if you want to keep the code private.
4. Do **not** add a README, .gitignore, or license (this repo already has them).
5. Click **Create repository**.

### Push this project from your machine

From the project folder, run:

```bash
cd /Users/mattspacegrey/Documents/GitHub/Shelley_Wire_Tracker

# Stage and commit everything (if not already committed)
git add .
git commit -m "Initial commit: Shelley Wire Tracker"

# Add GitHub as remote (replace YOUR_USERNAME and YOUR_REPO with your GitHub repo)
git remote add origin https://github.com/YOUR_USERNAME/Shelley_Wire_Tracker.git

# Push (use main or master depending on your default branch)
git push -u origin main
```

If your default branch is `master` instead of `main`:

```bash
git branch -M main
git push -u origin main
```

Use your GitHub username/password or a **Personal Access Token** (recommended) when prompted. For HTTPS, GitHub requires a token instead of a password: [Create a token](https://github.com/settings/tokens) with `repo` scope.

---

## 2. Set up Railway

### Create a Railway project and add PostgreSQL

1. Go to [railway.app](https://railway.app) and sign in (GitHub is easiest).
2. Click **New Project**.
3. Choose **Deploy from GitHub repo**.
4. Select your **Shelley_Wire_Tracker** repo (you may need to grant Railway access to the repo first).
5. Railway will add a **Web Service** from that repo. Before that, add the database:
   - In the project, click **+ New**.
   - Select **Database** → **PostgreSQL**.
   - Wait for it to provision. Click the PostgreSQL service and open the **Variables** or **Connect** tab.
   - Copy the **`DATABASE_URL`** (or note that it’s already in the project variables).

### Configure the Web Service

1. Click your **Web Service** (the one from GitHub).
2. Open **Variables** and add (or confirm) these:

   | Variable            | Value |
   |---------------------|--------|
   | `DATABASE_URL`      | From the PostgreSQL service: click it → **Variables** → copy `DATABASE_URL`, or use the **Reference** option to link it. |
   | `NEXTAUTH_SECRET`   | A long random string, e.g. run `openssl rand -base64 32` in a terminal and paste the result. |
   | `NEXTAUTH_URL`      | Your app URL. After first deploy: **Settings** → **Networking** → **Generate domain**, then use that URL (e.g. `https://shelley-wire-tracker-production.up.railway.app`). |
   | `AUTH_TRUST_HOST`  | Set to `true` on Railway so NextAuth trusts the proxy (required for login to work). |
   | `SETUP_SECRET`     | A random string (e.g. run `openssl rand -hex 16`). Used once to create the admin user; see **Create admin user** below. |

3. **Create admin user (if database is connected but empty)**  
   If you see "invalid email or password" and the database has no users:
   - In Railway → **Web Service** → **Variables**, add **`SETUP_SECRET`** (e.g. run `openssl rand -hex 16` locally and paste the value).
   - Redeploy so the new variable is set.
   - In your browser, open: **`https://shelleywiretracker-production.up.railway.app/api/setup?secret=YOUR_SETUP_SECRET`** (use the same value you set).
   - You should see `{"ok":true,"message":"Admin user created..."}`. Then sign in with **deb@shelleyelectric.com** / **DebIsHot*42**.
   - You can remove `SETUP_SECRET` after setup or leave it.

4. **Build & start (Railway usually detects Next.js):**
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** leave blank unless the app is in a subfolder.

5. Trigger a deploy: **Deployments** → **Redeploy**, or push a new commit to GitHub.

### Run database schema and seed (first time only)

Railway doesn’t run Prisma for you. Run these once from your **local machine** using the production `DATABASE_URL`:

1. In Railway, open your **PostgreSQL** service → **Variables** (or **Connect**) and copy **`DATABASE_URL`**.
2. Locally:

   ```bash
   cd /Users/mattspacegrey/Documents/GitHub/Shelley_Wire_Tracker

   # Apply schema
   DATABASE_URL="paste-your-railway-DATABASE_URL-here" npx prisma db push

   # Create admin user (set a strong password for production)
   DATABASE_URL="paste-your-railway-DATABASE_URL-here" ADMIN_INITIAL_PASSWORD="your-secure-password" npm run db:seed
   ```

3. Replace `paste-your-railway-DATABASE_URL-here` with the real URL (in quotes). Use the same for both commands. Use a strong `ADMIN_INITIAL_PASSWORD`; this is the password for **deb@shelleyelectric.com**.

### Get your app URL and fix NEXTAUTH_URL

1. In Railway, open your **Web Service** → **Settings** → **Networking**.
2. Under **Public Networking**, click **Generate domain** (or use an existing one). You’ll get a URL like `https://shelley-wire-tracker-production.up.railway.app`.
3. In the Web Service **Variables**, set:
   - `NEXTAUTH_URL` = that exact URL (e.g. `https://shelley-wire-tracker-production.up.railway.app`).
4. Redeploy so the new variable is used.

---

## 3. After deploy

- Open **NEXTAUTH_URL** in a browser and you should see the login page.
- Log in with **deb@shelleyelectric.com** and the password you used in `ADMIN_INITIAL_PASSWORD`.
- Change the admin password later by adding a “change password” feature or by re-running the seed with a new password (seed script skips creating the user if the email already exists, so you’d need to update the user in the DB or add a proper password-change flow).

---

## Troubleshooting

**"Can't reach database server at localhost:5432"**  
The Web Service is using a local/default `DATABASE_URL`. Fix it: open **Web Service** → **Variables**, remove or reset `DATABASE_URL`, then add it again using **Railway’s variable reference** to the Postgres service’s `DATABASE_URL` (Add variable / Reference → Postgres → `DATABASE_URL`). Do not paste a `localhost` URL.

**Auth error page shows localhost:3000 or redirects to localhost**  
Set `NEXTAUTH_URL` on the **Web Service** to your real app URL, e.g. `https://shelleywiretracker-production.up.railway.app` (no trailing slash). Then redeploy.

**Deployment shows "Failed to launch" even though build succeeded**  
The app now starts the Next.js server first so Railway’s health check gets a response quickly. If it still fails: in **Web Service** → **Settings** → **Health Check** (or **Deploy**), set the health check path to **`/api/health`** so Railway pings a simple 200 response instead of the root URL. Ensure **AUTH_TRUST_HOST** is set to **`true`** in Variables.

**"Invalid email or password" and database is empty**  
No users exist yet. Use the **Create admin user** steps above: set `SETUP_SECRET`, then visit `/api/setup?secret=YOUR_SETUP_SECRET` once in your browser.

---

## Quick reference

| Step | Action |
|------|--------|
| GitHub | New repo → `git add` / `git commit` → `git remote add origin` → `git push` |
| Railway | New Project → Deploy from GitHub repo → Add PostgreSQL → Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| DB once | `DATABASE_URL="..." npx prisma db push` and `DATABASE_URL="..." ADMIN_INITIAL_PASSWORD="..." npm run db:seed` |
| App URL | Web Service → Settings → Networking → Generate domain → set `NEXTAUTH_URL` and redeploy |
