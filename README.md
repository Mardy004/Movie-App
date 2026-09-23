# 🎬 MovieShow

A movie catalogue web app with a public browsing experience (home, browse, search, movie
details, **comments chat**) and a protected admin dashboard (CRUD, TMDB import, trending
stats, admin **comment replies**).

- **Frontend:** React 19 + Vite (run with `npm run dev`)
- **Backend:** Node.js + Express REST API (JSON file database, TMDB integration)
- **Dark theme:** `rgb(10, 10, 10)` / `#0A0A0A` surfaces

---

## 🚀 Quick start

Open **two terminals** from the project root (`Movie/`).

### 1) Backend (port 4000)

```bash
cd backend
npm install        # first time only
npm run dev        # starts http://localhost:4000
```

### 2) Frontend (port 5173)

```bash
cd frontend
npm install        # first time only
npm run dev        # starts http://localhost:5173
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies every
`/api/*` request to the backend, so no CORS or absolute URLs are needed.

### 3) Load some movies (first run)

The catalogue ships with a small demo seed. To fill it from **TMDB** (API key already
configured in `backend/.env`):

- Sign in at `/admin/login` (demo credentials: **admin / admin123**)
- Dashboard → import trending titles, or import a single movie by its TMDB id
  (e.g. `550` = Fight Club).
- Or call the API directly:

```bash
# get an admin token
curl -X POST http://localhost:4000/api/auth/login \
  -H "content-type: application/json" -d '{"username":"admin","password":"admin123"}'

# bulk-import 10 trending TMDB movies
curl -X POST http://localhost:4000/api/admin/import/trending \
  -H "authorization: Bearer <TOKEN>" -H "content-type: application/json" \
  -d '{"limit": 10, "refresh": true}'
```

---

## ✨ Features

### Public
- **Home** — hero banner, trending rails, recently added
- **Browse** — search, genre filters, sorting (trending / rating / views / title)
- **Movie detail** — artwork, metadata, like, related titles
- **▶️ Watch & Download** — "Watch now" opens an in-app player:
  - If the admin attached a video file (`Video URL` in the dashboard) it **streams right
    in the browser** through the API (HTTP Range → seeking works) and a **Download**
    button saves it as `movie-title.mp4`.
  - Otherwise the **official TMDB trailer** (YouTube) plays embedded.
- **💬 Comments chat** — anyone can post a comment on a movie with just a display name
  (**no email / no Gmail / no account required**). The admin's reply appears directly
  under the comment as a highlighted thread bubble.

### Admin (`/admin`, token-protected)
- Create / edit / delete movies with validation
- One-click TMDB import (single id or trending bulk)
- Trending, views, likes stats (now includes comment counters)
- **Reply to any user comment** and delete abusive ones — replies happen inline on the
  movie page while signed in (admin session = the same signed token used by the API)

---

## 🔧 Technologies used

| Layer | Technology |
| --- | --- |
| Frontend framework | **React 19** |
| Build tool / dev server | **Vite 7** (`npm run dev`) |
| Routing | **react-router-dom v7** |
| Styling | **Tailwind CSS 3** (custom dark palette on `#0A0A0A`) + PostCSS/Autoprefixer |
| Icons | Hand-rolled inline SVG set (no icon dependency) |
| State | React Context (`AuthContext`, `ToastContext`) + custom hooks |
| HTTP | Native `fetch` with a thin API client and a Vite `/api` proxy |
| Backend | **Node.js (ES Modules)** + **Express 4** |
| Database | **JSON file store** (`backend/data/db.json`) with atomic writes & a mutation queue — zero DB install |
| Auth | Stateless HMAC-SHA256 signed tokens (JWT-style, no external service, **no Gmail**) |
| External API | **TMDB v3** (key in `backend/.env`) for trending/search/import |
| Tests | Node built-in test runner (`npm test` in `backend/`) |

---

## 💬 How the comment chat works

```
Guest browser                        Backend                      Admin browser
     │  POST /api/movies/:id/comments     │                              │
     │  { name, body }  (no email!)       │  stored in data/db.json      │
     │ ─────────────────────────────────► │                              │
     │                                    │ ◄──── POST .../reply ────────│
     │                                    │   (Bearer admin token)       │
     │  GET /api/movies/:id/comments      │                              │
     │ ◄───────────────────────────────── │  reply shown under comment   │
```

- Anyone can **comment** with any display name (2–40 chars) and a message (≤ 1000 chars).
- Only a signed-in **admin** can **reply** (inline bubble under the comment) or **delete**.
- Nothing is emailed anywhere — replies live in the same thread, stored in the JSON DB.

### Comment API

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/movies/:id/comments` | public | list a movie's thread |
| POST | `/api/movies/:id/comments` | public | post `{ name, email, body }` |
| POST | `/api/movies/:id/comments/:commentId/reply` | admin | reply `{ body }` |
| DELETE | `/api/movies/:id/comments/:commentId` | admin | delete a comment |

### Watch / Download API

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/movies/:id/watch` | public | `{ mode: 'file' \| 'youtube' \| 'none', src, downloadUrl }` for the player |
| GET | `/api/movies/:id/stream` | public | proxies the video file (HTTP Range = seeking); add `?download=1` to force a download |

> How to give a movie a real video: sign in at `/admin/login` → edit the movie →
> **Video URL (full movie file)** → paste a direct `https://…/movie.mp4` link → save.
> The sample title ships with a small Big Buck Bunny clip so you can try Watch +
> Download immediately.

---

## 🗺️ Project structure

```
Movie/
├── backend/
│   ├── data/db.json            # the whole database (movies + comments)
│   ├── src/
│   │   ├── server.js           # listens on PORT 4000
│   │   ├── app.js              # express app + route mounting
│   │   ├── config/             # .env loading + defaults
│   │   ├── routes/             # movies, comments, auth, admin, meta (+ stream/watch)
│   │   ├── services/           # movies, comments, stream, TMDB provider, trending score
│   │   ├── middleware/         # HMAC token auth + error handling
│   │   ├── store/              # atomic JSON store (queue + temp-file rename)
│   │   └── scripts/            # seed.js, check.js, verify-comments.mjs, verify-watch.mjs
│   └── .env                    # admin creds, auth secret, TMDB key
└── frontend/
    ├── index.html
    ├── vite.config.js          # dev server + /api proxy → :4000
    ├── tailwind.config.js      # dark palette (#0A0A0A surfaces)
    └── src/
        ├── api/client.js       # fetch wrapper + all endpoints (incl. comments)
        ├── components/
        │   ├── comments/CommentSection.jsx   # 💬 guest comments + admin replies
        │   ├── movies/WatchModal.jsx         # ▶️ in-app player + download button
        │   ├── movies/ layout/ admin/ common/
        ├── context/            # AuthContext (admin session), ToastContext
        ├── hooks/              # useMovies, useMeta, useDebounced
        └── pages/              # Home, Browse, MovieDetail, AdminLogin, AdminDashboard
```

---

## ⚙️ Configuration (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Backend port |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `admin123` | Dashboard sign-in |
| `AUTH_SECRET` | dev value | Token signing secret (change in production!) |
| `AUTH_TTL_SECONDS` | `43200` | Session lifetime (12 h) |
| `DB_FILE` | `data/db.json` | Database file |
| `MOVIE_API_BASE_URL` | `https://api.themoviedb.org/3` | Movie provider |
| `MOVIE_API_KEY` | TMDB key (already set) | Provider credentials |
| `MOVIE_API_IMAGE_BASE` | `https://image.tmdb.org/t/p` | Poster/backdrop CDN |

Frontend: `VITE_PROXY_TARGET` (default `http://localhost:4000`) only.

---

## 🌙 Dark theme (`rgb(10,10,10)`)

All app surfaces use the `ink` scale in `frontend/tailwind.config.js`
(`ink-950/900 = #0A0A0A`), mirrored as CSS variables in `frontend/src/index.css`.
Re-theming = editing those two files.

---

## ✅ Verification / tests

```bash
# Backend: start it, then run the comments + TMDB end-to-end checks
cd backend
npm run dev                        # terminal 1
node scripts/verify-comments.mjs   # terminal 2 — all PASS expected
node scripts/verify-watch.mjs      # watch/stream/download checks — all PASS expected

# Backend unit/API tests
npm test

# Frontend production build
cd ../frontend
npm run build
```

## 🛠 Troubleshooting

| Problem | Fix |
| --- | --- |
| `Cannot reach the API server` toast | Backend not running → `cd backend && npm run dev` |
| Port 4000 already in use | `PORT=4001` in `backend/.env`, restart; set `VITE_PROXY_TARGET=http://localhost:4001` |
| Empty catalogue | Sign in at `/admin/login`, import trending from TMDB |
| Lost admin session | Token expired (12 h) → sign in again |
