# Trillionet Student Portal

React + Vite frontend with an Express + JWT + Postgres authentication backend.
Built around short courses ("packages" — CorelDraw, Photoshop, Illustrator,
InDesign, Website Development, App Development, Database, and whatever gets
added later) instead of a university semester model.

## Run it locally (two terminals)

Terminal 1 — the auth server. You need a Postgres database to point it at —
either install Postgres locally, or just create your free Neon database now
(see the deployment section below) and use that connection string even for
local dev.

    cd server
    npm install
    cp .env.example .env        # then fill in DATABASE_URL and the two JWT secrets
    npm run migrate              # creates the users + refresh_tokens tables
    npm run seed                  # creates one demo student account
    npm run dev                    # http://localhost:5000

Terminal 2 — the frontend:

    npm install
    npm run dev       # http://localhost:5173

Sign in with the seeded demo account:

    Reg no:   TCT/2024/0142
    Password: password123

## Deploying for real — Neon (database) + Render (backend + frontend)

Total cost: $0. Three accounts, ~15 minutes.

### 1. Database — Neon

1. Go to neon.com → sign up → **New Project**. Pick a region close to your
   users (e.g. a European region if most of your students are in Kenya —
   there's no African region yet, so pick the closest one).
2. On the project dashboard, copy the **connection string** — it looks like
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`
3. Keep that tab open, you'll paste it into Render in a minute.

Neon's free tier auto-suspends the database after 5 minutes idle and wakes
it again in milliseconds on the next query — no manual "resume" step, unlike
some competitors. You don't need to do anything to keep it alive.

### 2. Backend — Render Web Service

1. Push this project to a GitHub repo (Render deploys from Git).
2. On render.com → **New** → **Web Service** → connect your repo.
3. Set:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Instance type**: Free
4. Add environment variables (Render dashboard → Environment):
   - `DATABASE_URL` — the Neon connection string from step 1
   - `JWT_ACCESS_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `JWT_REFRESH_SECRET` — generate a **different** one the same way
   - `ACCESS_TOKEN_TTL` = `15m`
   - `REFRESH_TOKEN_TTL` = `7d`
   - `NODE_ENV` = `production`
   - `CLIENT_ORIGIN` — you'll fill this in after step 3, once you know your
     frontend's URL
5. Deploy. Once it's live, open a shell from the Render dashboard (or run
   locally against the Neon URL) and run once:
   `npm run migrate && npm run seed`
6. Note your backend's URL — something like `https://trillionet-api.onrender.com`

Free web services spin down after 15 minutes with no traffic and take
30–60 seconds to wake up on the next request. For ~100 students checking
a portal a few times a day, this mostly means the *first* visit of the day
is slow, not every visit — traffic from anyone using it keeps it warm.
If that first-load delay ever becomes a real problem, the fix is a $7/month
paid instance, nothing about the code needs to change.

### 3. Frontend — Render Static Site

1. render.com → **New** → **Static Site** → same repo.
2. Set:
   - **Root directory**: leave blank (repo root)
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `dist`
3. Add environment variable:
   - `VITE_API_URL` = `https://trillionet-api.onrender.com/api` (your backend
     URL from step 2, with `/api` on the end)
4. Deploy. Note this URL too — something like `https://trillionet-portal.onrender.com`

### 4. Close the loop

Go back to the **backend** service's environment variables and set
`CLIENT_ORIGIN` to your frontend's actual URL from step 3, then redeploy the
backend. This is what makes CORS and the cross-site cookie work correctly —
skip it and login will fail with a CORS error in the browser console.

Static sites don't spin down or cold-start — they're just files on a CDN.

## How the auth actually works

- Passwords are hashed with bcrypt — never stored or compared in plain text.
- Login issues two tokens:
  - an **access token** (JWT, 15 min) sent back in the response body and
    kept only in memory on the frontend (never localStorage — nothing an
    XSS payload could steal from browser storage)
  - a **refresh token** (JWT, 7 days) set as an **httpOnly cookie** the
    frontend's JS can never read, and also recorded in the `refresh_tokens`
    Postgres table
- Refreshing the page calls `/api/auth/refresh` on load — if the cookie is
  still valid you're silently signed back in with no re-entering credentials
- Any API call that gets a 401 automatically tries one silent refresh before
  giving up and sending you to `/login` (`src/api/client.js`)
- Refresh tokens are **rotated** on every use — the old one is deleted from
  Postgres and a new one issued, so a leaked refresh token has a short shelf
  life even if nobody notices
- **Logout deletes the token from the database** — it's a real revocation,
  not just clearing a cookie client-side
- `ProtectedRoute` wraps every page except `/login`; no valid session means
  a redirect there

## Project layout

    trillionet-portal/
      src/                    — React frontend
        api/client.js         — fetch wrapper: attaches token, retries on 401
        context/
          AuthContext.jsx     — login/logout, session restore on load
          ThemeContext.jsx    — light/dark toggle
        components/
          ProtectedRoute.jsx  — redirects to /login if not authenticated
          Layout, TopNav, Sidebar, Rings
        data/mock.js          — feature data (packages, fees, etc.) — still
                                 static; only auth is wired to a real database
        pages/
          Login, Dashboard, Packages, Schedule,
          Assignments, Messages, Fees, Account
      server/                 — Express auth API
        src/
          index.js            — app entry, CORS + cookie config, token cleanup
          migrate.js            — applies db/schema.sql
          seed.js                — creates the demo account
          db/
            pool.js             — Postgres connection pool
            queries.js           — all SQL in one place
            schema.sql            — users + refresh_tokens tables
          routes/auth.js       — login, refresh, logout, me
          middleware/auth.js   — verifies the access token

## What's covered

Real login backed by a real Postgres database, session persistence across
refresh, rotating refresh tokens, and proper logout/revocation — the kind of
auth that's fine to actually put in front of real students. Feature pages
(packages, fees, assignments, messages) still run on the mock data in
`data/mock.js` — the login wall is real, what's behind it isn't wired to the
database yet.

## Adding your logo

Drop your crest into `public/logo.png`, then in `src/pages/Login.jsx` swap:

    <div className="logo-slot"><i className="ti ti-school"></i></div>

for

    <img src="/logo.png" alt="Trillionet Computer Training Center" style={{ width: 32, height: 32 }} />

## Not yet built

Instructor, Finance, and Administrator portals; the feature pages (packages,
fees, etc.) wired to real database tables instead of mock data; password
reset flow; rate limiting on login attempts.
