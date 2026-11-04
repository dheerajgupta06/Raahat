# Raahat

**Emergency me sabse pehle Raahat.**

Raahat is a mobile-first emergency hospital finder for India. In a crisis it turns a location and a symptom into a ranked list of nearby hospitals with live bed counts, oxygen status, verified contact numbers, directions, and one-tap calling.

> **Disclaimer:** Raahat is not a replacement for professional medical advice. In critical conditions call **112** immediately.

---

## Highlights

- **Emergency-first triage** — pick from 10 large problem cards, select severity, and get matched hospitals in one tap.
- **Live availability** — bed counts (General / ICU / Oxygen / Ventilator / Emergency), oxygen status, ventilators and occupancy, refreshed over Socket.io.
- **Smart matching** — Haversine distance, required specialty, bed availability, oxygen, 24x7, and severity-weighted scoring.
- **Actionable hospital cards** — reception, emergency ward, ambulance, directions, WhatsApp share, and copy-number controls. Emergency ward is promoted when reception is closed.
- **List + map** — Leaflet map with pins coloured by bed availability, synced with the ranked list.
- **Hospital operations dashboard** — JWT login, one-tap `+1 / −1` bed updates, oxygen status and cylinders, doctors on duty, contacts, reception timings, and a verification button.
- **Control-room app** — a separate operator PWA with a hospital approval queue, certificate preview, approve/reject decisions, network stats, contact verification, and realtime Socket.io alerts with browser notifications.
- **Privacy by design** — public payloads never include the receptionist's name or alternate/personal line. Only the official reception line is displayed.
- **Works in the field** — PWA install, offline caching of the last results and phone numbers, dark/light themes, large-text mode, English/Hindi, voice input, first-aid tips, and saved family contacts with a "send my location" action.
- **No setup required** — with no `MONGODB_URI`, the API boots an in-memory MongoDB and auto-seeds 25 fictional Delhi NCR hospitals.

> All hospital names, addresses, and phone numbers in the seed data are **dummy/fictional**. No real hospital is contacted by this demo.

## Tech stack

| Layer | Technology |
| --- | --- |
| Web | React 18, Vite 5, Tailwind CSS 3, React Router 6, Leaflet 1.9, Socket.io client |
| Map tiles | Esri World Dark/Light Gray Canvas (keyless), data © OpenStreetMap contributors |
| API | Node.js 18+, Express 4, Mongoose 8, Socket.io 4 |
| Data | MongoDB with a `2dsphere` index (MongoDB Atlas / local mongod / in-memory fallback) |
| Auth & safety | JWT, bcryptjs, zod validation, helmet, CORS allow-list, express-rate-limit, payload cap |
| PWA | vite-plugin-pwa + Workbox (NetworkFirst API cache, CacheFirst tiles) |
| Tests | Node test runner + supertest + mongodb-memory-server |

## Project structure

```
Rahaat 2/
├── client/                      # React + Vite PWA
│   ├── public/icons/            # PWA icons
│   ├── src/
│   │   ├── components/          # Cards, map, SOS modal, layout, auth shell, UI primitives
│   │   ├── context/             # AppContext: language, theme, location, auth, toasts
│   │   ├── hooks/               # Data fetching, live updates, saved contacts, speech
│   │   ├── lib/                 # API client, socket, cache, i18n, formatting, problems
│   │   └── pages/               # Home, Results, Hospital, Login, Register, Dashboard, 404
│   ├── vercel.json              # SPA rewrite for Vercel
│   └── vite.config.js           # Proxy, PWA manifest, Workbox, chunking
├── admin/                       # Raahat Control — operator PWA (port 5174)
│   ├── src/
│   │   ├── components/          # Shell, document viewer, review dialog, toasts
│   │   ├── context/             # Admin auth, realtime alerts, toasts
│   │   ├── lib/                 # API client, formatting, links
│   │   └── pages/               # Login, Overview, Approvals, Hospitals, Alerts
│   ├── vercel.json              # SPA rewrite for Vercel
│   └── vite.config.js           # Proxy, PWA manifest, notifications
├── server/
│   ├── src/
│   │   ├── config/              # env loader, Mongo connection + auto-seed
│   │   ├── controllers/         # Auth, hospital and control-room handlers
│   │   ├── middleware/          # JWT, validation, upload, rate limits, errors
│   │   ├── models/              # Hospital, Admin and Notification schemas
│   │   ├── routes/              # /api/auth, /api/hospitals, /api/admin
│   │   ├── seed/                # 25 dummy Delhi NCR hospitals + control-room account
│   │   ├── services/            # Matching score, serializers, uploads, notifications, Socket.io
│   │   ├── utils/               # Geo, phone validation, IST timings, HTTP helpers
│   │   └── validators/          # zod request schemas
│   ├── tests/                   # API integration tests
│   └── uploads/                 # Private registration certificates (gitignored)
├── portal.html                  # Opens the live website (auto-detects its port)
├── Start Raahat.bat             # Starts the app and opens it (Windows)
├── scripts/                     # Launcher helper
├── package.json                 # npm workspaces + root scripts
└── README.md
```

## Quick start

**Prerequisites:** Node.js 18.18+ and npm 9+ (no local MongoDB needed for development).

```bash
npm install
npm run dev
```

- Web: <http://localhost:5173>
- Control room: <http://localhost:5174>
- API: <http://localhost:5000> (health check: <http://localhost:5000/api/health>)
- One-click portal: double-click [`Start Raahat.bat`](Start%20Raahat.bat) — it starts the app if needed, waits for it, and opens the site. [`portal.html`](portal.html) opens the site directly when it is already running. Keep the Raahat command window open while using the app.

Without `MONGODB_URI`, the API starts an in-memory MongoDB, seeds 25 hospitals, and prints the demo login. Data resets when the API stops.

### Open on your phone (same Wi-Fi)

The dev server listens on the local network. Start Raahat, then open the phone URL:

1. Connect the PC and phone to the same Wi-Fi network.
2. Run `Start Raahat.bat` or `npm run dev`. The launcher prints the phone URL, and Vite also shows a `Network:` address.
3. On the phone, open `http://<PC-IPv4>:5173` (for example `http://192.168.1.5:5173`).
4. If Windows asks, allow Node.js through the firewall on **private networks**.

The Vite proxy forwards `/api` and Socket.io, so phone clients use the same live data. Plain HTTP on a LAN is not a secure context, so browsers may block phone geolocation and PWA installation; use the manual city/area picker, or deploy over HTTPS for the full experience. Only use this on a trusted network.

### Demo hospital login

```
Email:    demo@raahat.demo
Password: Raahat@123
```

Every seeded hospital has an account (`hospital2@raahat.demo` … `hospital25@raahat.demo`) with the same password. These are demo-only credentials.

### Demo control-room login

```
Email:    control@raahat.demo
Password: Raahat@123
```

Open <http://localhost:5174>, sign in, then submit a hospital registration from the public site. The application lands in **Approvals** immediately, a realtime alert appears on the Overview and Alerts tabs, and approving it updates the hospital dashboard. Use **Enable alerts** on the Alerts tab to allow browser notifications. For a real deployment, create an operator with `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run create-admin` instead of using the demo account.

### Persistent MongoDB (optional)

```bash
cp server/.env.example server/.env
# set MONGODB_URI, e.g. mongodb://127.0.0.1:27017/raahat
npm run seed     # reset demo records and re-seed
npm run dev
```

`npm run seed` deletes and recreates only `isDemo` records; registered hospitals are left untouched.

## Scripts

Run from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | API (`node --watch`) + web + control-room Vite servers together |
| `npm run dev:server` | API only, with restart on change |
| `npm run dev:client` | Public web app only |
| `npm run dev:admin` | Control-room app only (port 5174) |
| `npm run build` | Production builds for the client and control room |
| `npm run build:client` | Public web build (`client/dist`) |
| `npm run build:admin` | Control-room build (`admin/dist`) |
| `npm run start` | Start the API in production mode |
| `npm run seed` | Seed/reset the 25 demo hospitals and demo accounts |
| `npm run create-admin` | Create/update a real control-room account (server workspace env) |
| `npm test` | Run backend integration tests |

## Environment variables

### Server — `server/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Set `production` on deployed servers |
| `PORT` | `5000` | HTTP port |
| `MONGODB_URI` | _(empty)_ | Mongo connection string. Empty = in-memory DB in development; **required** in production |
| `JWT_SECRET` | dev fallback | Signing key. **Required** in production |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGINS` | `http://localhost:5173` | Comma-separated CORS/Socket.io allow-list |
| `DB_AUTO_SEED` | `true` | Seed demo hospitals when the database is empty (`false` to disable) |
| `UPLOAD_DIR` | `server/uploads` | Private storage for hospital registration certificates. On ephemeral hosts (Render free tier) mount a persistent disk or use object storage |

### Client — `client/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | _(empty)_ | API origin. Empty uses the Vite proxy in dev; set the public API URL for production |

### Control room — `admin/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | _(empty)_ | API origin. Empty uses the Vite proxy in dev; set the public API URL for production |
| `VITE_PUBLIC_SITE_URL` | dev `:5173` | Public finder link used by "Public site" / "Open listing" actions |
| `VITE_STAFF_SITE_URL` | dev `:5173/login` | Hospital staff sign-in link (optional) |

Control-room accounts are created with `ADMIN_EMAIL` and `ADMIN_PASSWORD` using `npm --workspace server run create-admin` (or `npm run create-admin` from the server directory). The seeded demo account is `control@raahat.demo` / `Raahat@123`.

## API reference

Base URL: `http://localhost:5000/api`. All responses are JSON.

- Success: `{ "success": true, "data": ... }` (list endpoints add `meta`)
- Error: `{ "success": false, "message": "...", "errors": [{ "path": "...", "message": "..." }] }`
- Authenticated requests use `Authorization: Bearer <jwt>`

### Health and stats

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Service status, DB mode, realtime readiness |
| `GET` | `/hospitals/stats` | Network totals: hospitals, beds, ICU available, oxygen-ready, verified centres |

### Public hospital discovery

| Method | Path | Query | Description |
| --- | --- | --- | --- |
| `GET` | `/hospitals/nearby` | `lat`, `lng` (required), `radius` (1–50, default 10), `problem` (default `other`), `severity` (default `serious`), `sort` (`nearest`/`best`/`beds`/`oxygen`, default `nearest`) | Ranked hospitals within the radius |
| `GET` | `/hospitals/:id` | `lat`, `lng` (optional, for distance/ETA) | One hospital with public contacts |
| `GET` | `/hospitals/:id/contacts` | — | Sanitized public contact block |

Problem keys: `heart`, `breathing`, `accident`, `stroke`, `pregnancy`, `burns`, `fever`, `poisoning`, `child`, `other`.
Severities: `critical`, `serious`, `moderate`.

### Auth

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | multipart/form-data: `admin` (JSON), `hospital` (JSON), `document` (PDF/JPG/PNG ≤ 5 MB) | Create an admin + hospital; returns `{ token, admin, hospital }` |
| `POST` | `/auth/login` | `{ email, password }` | Returns `{ token, admin, hospital }` |
| `GET` | `/auth/me` | — (Bearer) | Current admin and hospital |

Registration requires admin name/email/password (8–72 chars) and hospital name, type (`Govt`/`Private`/`Trust`), address, city, state, 6-digit pincode, lat/lng, at least one specialty, an official reception phone, and the hospital registration certificate. The certificate is stored outside the database under `server/uploads/registrations/` (set `UPLOAD_DIR` to change this) and starts with status `pending`.

### Hospital management (Bearer token, own hospital only)

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/hospitals/me` | — | Owner view of the hospital (includes private fields) |
| `GET` | `/hospitals/me/registration` | — | Download the owner's registration certificate (never public) |
| `PUT` | `/hospitals/:id/beds` | e.g. `{ "general": { "available": 42 } }` | Partial bed patch. Bed keys: `general`, `icu`, `oxygen`, `ventilator`, `emergency`; each accepts `total` / `available` |
| `PUT` | `/hospitals/:id/oxygen` | `{ oxygenStatus, oxygenCylinders }` | `available` / `limited` / `unavailable` |
| `PUT` | `/hospitals/:id/contacts` | `{ reception: { phone, whatsapp, timings, ... }, emergencyWard: { phone }, ambulance, mainLine }` | Update public/private contacts |
| `PUT` | `/hospitals/:id/profile` | `{ specialties, doctorsOnDuty, is24x7, ambulanceAvailable }` | Update capabilities and staff |
| `POST` | `/hospitals/:id/contacts/verify` | — | Mark contacts verified and refresh availability timestamp |

**Phone validation:** 10-digit Indian mobile numbers (optionally with `+91`/`91`/leading `0`) or landlines with STD code. Alternate/receptionist fields are stored privately and never returned by public endpoints.

### Control room (super-admin Bearer token)

| Method | Path | Body / Query | Description |
| --- | --- | --- | --- |
| `POST` | `/admin/login` | `{ email, password }` | Control-room sign-in; hospital accounts receive `403` |
| `GET` | `/admin/me` | — | Current operator |
| `GET` | `/admin/overview` | — | Network stats, approval counts and recent registrations |
| `GET` | `/admin/registrations` | `status` (`pending`/`verified`/`rejected`/`all`, default `pending`) | Registration queue with applicant and certificate metadata |
| `GET` | `/admin/registrations/:id/document` | — | Private certificate download for review |
| `POST` | `/admin/registrations/:id/review` | `{ decision: "approve" \| "reject", note? }` | Approve/reject a certificate. Rejection requires a note (4–400 chars) |
| `GET` | `/admin/hospitals` | `q`, `status` (`all`/`pending`/`verified`/`rejected`/`unregistered`) | Search the registry |
| `POST` | `/admin/hospitals/:id/verify-contacts` | — | Mark published contact lines verified (public badge for 30 days) |
| `GET` | `/admin/notifications` | `limit` (1–100, default 30) | Alerts with unread count |
| `POST` | `/admin/notifications/:id/read` | — | Mark one alert read |
| `POST` | `/admin/notifications/read-all` | — | Mark every alert read |

Approving or rejecting a registration never exposes the receptionist's name or alternate line; the control-room serializer also omits those private fields.

### Realtime

Connect with Socket.io to the API origin (same CORS rules). Clients join the `public` room automatically and receive:

- `network:hello` `{ ok, serverTime }` on connect
- `hospital:update` — a full **sanitized** hospital snapshot after any bed, oxygen, contact, or profile change

Control-room sockets connect with `auth: { token }` (the super-admin JWT) and join the private `admins` room. They receive `admin:ready`, plus `admin:notification` whenever a hospital registers, is approved/rejected, or its contacts are verified.

### Rate limits

| Scope | Limit |
| --- | --- |
| All `/api` requests | 900 / 15 min / IP |
| Login | 25 / 15 min / IP |
| Registration | 15 / hour / IP |
| Authenticated writes | 300 / 15 min / IP |

Limits are disabled when `NODE_ENV=test`.

## Matching and scoring

1. `2dsphere` `$near` finds hospitals within the selected radius (10/25/50 km).
2. Haversine distance produces distance and a rough ETA.
3. Each problem maps to specialties and facilities (`server/src/constants.js`).
4. Severity weights distance vs. capability differently — critical cases weight specialty/ICU/oxygen more, moderate cases favour proximity.
5. Results default to `nearest` (closest distance first) and can be re-sorted by `best` (weighted score), total available beds, or oxygen readiness.

Status colours: ≥30% beds available = green, ≥10% = yellow, below that = red. Data older than **6 hours** is marked stale. Contacts verified in the last **30 days** show a verified badge. Reception open/closed is evaluated in IST.

## Privacy, security, and safety

- Only `reception.phone`, `whatsapp`, emergency ward, ambulance, and main line are public. `receptionistName` and `alternatePhone` are omitted by the serializer.
- JWT-protected writes are scoped to the authenticated admin's hospital; no cross-hospital edits.
- Control-room endpoints require the `super_admin` role. Hospital staff tokens receive `403`, and control-room payloads still hide receptionist names and alternate numbers.
- Passwords are bcrypt-hashed; tokens expire (default 7 days).
- zod validates and coerces every public request; JSON bodies are capped at 150 kB.
- helmet security headers, a strict CORS allow-list, and per-route rate limits are enabled.
- Seeds and docs use dummy phone numbers and fictional hospitals. Replace all seed data before any real deployment.
- In an emergency, call **112** (or **102/108** for ambulance services). Raahat only helps locate care.

## Offline and PWA

- The production build registers a service worker (auto-update).
- The last successful `/api` responses are cached NetworkFirst (4 s timeout, 24 h) and results are mirrored in `localStorage`, so numbers and hospital details remain readable offline.
- Map tiles are cached for 7 days after first view.
- Offline banners and stale-data labels keep users aware of what they are seeing.
- Theme, large-text preference, language, saved contacts, and last known location persist locally.

## Testing

```bash
npm test
```

The suite uses `mongodb-memory-server` and covers health, discovery, sorting, detail/contact privacy, registration, login, auth failures, bed/oxygen/contact updates, verification, control-room auth/queue/notifications/approvals/document privacy, and validation errors.

## Deployment

### 1. MongoDB Atlas

1. Create a free cluster and a database user.
2. Add your server's IP (or `0.0.0.0/0` for a hosted API) to Network Access.
3. Copy the SRV connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/raahat`.

### 2. Backend on Render

1. New **Web Service** from the repository.
2. Root directory: `server`; build command `npm install`; start command `npm start`.
3. Environment:
   - `NODE_ENV=production`
   - `MONGODB_URI=<Atlas SRV URI>`
   - `JWT_SECRET=<long random string>`
   - `CLIENT_ORIGINS=https://your-client.vercel.app,https://your-control.vercel.app`
   - `DB_AUTO_SEED=true` on the first deploy (optional after seeding)
4. Deploy and confirm `https://<service>.onrender.com/api/health` returns `status: ok`.
5. Seed (optional, from Render Shell): `npm run seed`.
6. Create the real operator account from the Render Shell:
   `ADMIN_EMAIL=ops@yourdomain.in ADMIN_PASSWORD='<strong password>' npm run create-admin`

Socket.io runs on the same Render service; no extra configuration is needed.

### 3. Frontend on Vercel

1. Import the repository; set **Root Directory** to `client`.
2. Framework preset: Vite. Build `npm run build`; output `dist` (`client/vercel.json` already adds the SPA rewrite).
3. Environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com`.
4. Deploy, then add the Vercel domain to the API's `CLIENT_ORIGINS` and redeploy the API.
5. Test geolocation over HTTPS (required by browsers) and install the PWA from the browser menu.

### 4. Control room on Vercel

1. Import the same repository as a second project; set **Root Directory** to `admin`.
2. Framework preset: Vite. Build `npm run build`; output `dist` (`admin/vercel.json` adds the SPA rewrite).
3. Environment variables:
   - `VITE_API_URL=https://<your-render-service>.onrender.com`
   - `VITE_PUBLIC_SITE_URL=https://your-client.vercel.app`
   - `VITE_STAFF_SITE_URL=https://your-client.vercel.app/login`
4. Deploy, add the control-room domain to `CLIENT_ORIGINS` on the API, and redeploy the API.
5. Sign in with the operator account, install the app from the browser menu, and grant notification permission on the Alerts tab.

Notification delivery uses the browser Notification API over HTTPS. There is no SMS/email/push-server integration; alerts only arrive while the control-room app or its service worker can reach the realtime connection.

### Notes

- Serve both apps over HTTPS; geolocation and service workers require a secure context.
- The in-memory MongoDB fallback is for development only — production refuses to start without `MONGODB_URI`.
- If you change the client domain, update `CLIENT_ORIGINS`; Socket.io uses the same allow-list.

## Limitations

- Seed hospitals and phone numbers are fictional, and availability is demonstration data.
- No SMS/OTP verification, payment, or medical-record features.
- Reception timings are evaluated in IST; hospitals outside India would need timezone support.
- Map tiles require network access the first time; cached tiles are reused offline.
- This demo does not triage clinically — users must contact emergency services for medical decisions.

---

Built for the moments when every second counts. **Emergency me sabse pehle Raahat.**
