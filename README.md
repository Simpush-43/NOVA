# NOVA — Team Productivity Platform

*Plan. Collaborate. Deliver.*

A full-stack project management app: create projects, invite teammates, manage tasks on a
Kanban board, comment, and track progress — built for the Full Stack Development Intern
assignment.

**Stack:** Frontend → React 19 + TypeScript + Tailwind CSS v4 (Vite) · Backend → Node.js +
Express 5 · API → REST/JSON · Database → SQLite (Node's built-in `node:sqlite` — zero native
dependencies, no compiler required to install) · Auth → JWT + bcrypt · Deployment → see below.

---

## Features

- **Auth** — email/password signup and login, JWT sessions, bcrypt-hashed passwords
- **Projects** — create, edit, archive, delete; owner/admin/member roles
- **Team collaboration** — invite teammates by email, remove members, role-based permissions
- **Tasks** — full CRUD, 4-stage Kanban board (To do → In progress → In review → Done),
  drag-and-drop status changes, priority levels, due dates, assignees
- **Comments** — per-task discussion thread
- **Activity feed** — auto-logged project history (who did what, when)
- **Progress tracking** — live completion percentage per project

## Project structure

```
nova/
├── backend/          Express API + SQLite database
│   ├── src/
│   │   ├── db/            schema + connection
│   │   ├── middleware/     auth guard, project-membership guard
│   │   ├── routes/         auth, projects, tasks, users
│   │   ├── utils/           JWT + password helpers
│   │   └── index.js         app entry point
│   └── .env.example
└── frontend/         React SPA
    └── src/
        ├── api/            typed fetch client per resource
        ├── components/     Kanban board, modals, avatars, etc.
        ├── context/        auth context
        ├── pages/          Auth, Dashboard, Project board
        └── types.ts
```

## Running locally

Requires Node.js **22.5.0 or later** (the backend uses Node's built-in `node:sqlite` module —
no database server or native-module compiler to install).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET for anything beyond local testing
npm run dev                # starts on http://localhost:4000
```

The SQLite database file is created automatically at `backend/data/nova.db` on first run —
no separate database server to install.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

The dev server proxies `/api/*` to `http://localhost:4000`, so no extra configuration is
needed locally. Open http://localhost:5173, sign up, and start creating projects.

### Production build

```bash
cd frontend
npm run build                # outputs to frontend/dist
npm run preview              # serve the production build locally to sanity-check it
```

## Configuration

**Backend** (`backend/.env`):

| Variable     | Description                              | Default                |
|--------------|-------------------------------------------|-------------------------|
| `PORT`       | Port the API listens on                   | `4000`                  |
| `JWT_SECRET` | Secret used to sign session tokens        | *(must be set in prod)* |

**Frontend** (`frontend/.env`, optional):

| Variable        | Description                                             | Default |
|-----------------|-----------------------------------------------------------|---------|
| `VITE_API_URL`  | Base URL of the API. Leave unset to use same-origin `/api` in production, or the dev proxy locally. | `/api` |

## API overview

All endpoints are under `/api`. Authenticated routes expect `Authorization: Bearer <token>`.

| Method & path                              | Description                     |
|---------------------------------------------|----------------------------------|
| `POST /auth/register`                        | Create an account                |
| `POST /auth/login`                           | Sign in                          |
| `GET /auth/me`                               | Current user                     |
| `GET /projects`                              | List your projects (with stats)  |
| `POST /projects`                             | Create a project                 |
| `GET /projects/:id`                          | Project detail + members         |
| `PATCH /projects/:id`                        | Update a project                 |
| `DELETE /projects/:id`                       | Delete a project (owner only)    |
| `POST /projects/:id/members`                 | Invite a member by email         |
| `DELETE /projects/:id/members/:userId`       | Remove a member / leave          |
| `GET /projects/:id/activity`                 | Recent activity feed             |
| `GET /projects/:id/tasks`                    | List tasks in a project          |
| `POST /projects/:id/tasks`                   | Create a task                    |
| `PATCH /tasks/:id`                           | Update a task (incl. status)     |
| `DELETE /tasks/:id`                          | Delete a task                    |
| `GET /tasks/:id/comments`                    | List comments on a task          |
| `POST /tasks/:id/comments`                   | Add a comment                    |
| `GET /users/search?q=`                       | Search users (for assigning)     |

Every route validates its input (via Zod) and returns a JSON `{ error: "..." }` body with an
appropriate status code on failure — there are no unhandled crashes or silent failures.

## Deploying

This was built and tested locally with SQLite for simplicity (zero external services to
provision). To deploy:

1. **Backend** — deploy `backend/` to a host with a persistent disk (Render, Railway, Fly.io)
   running Node 22.5+. Set `JWT_SECRET` to a long random value. SQLite (via `node:sqlite`,
   built into Node — no extra install) works fine for a small team; for multi-instance or
   high-traffic deployments, swap it for a hosted Postgres (e.g. Neon, Supabase). The query
   layer in `src/routes/*.js` is plain SQL and isolated from the rest of the app, so this is
   a contained change.
2. **Frontend** — deploy `frontend/` to Vercel or Netlify. Set `VITE_API_URL` to your
   backend's public URL, then run the standard build (`npm run build`).
3. **CORS** — the backend currently allows all origins for ease of local testing
   (`app.use(cors())` in `src/index.js`). Before going live, restrict it to your deployed
   frontend's origin.

## What's not included (by design, given scope)

- Email delivery for invites (a teammate must already have an account; invited-by-email
  currently just adds them if they've signed up)
- Real-time updates (board refreshes on your own actions; no websocket push to teammates)
- Password reset flow

## Testing performed

The backend was exercised end-to-end against a running instance: registration/login and
every validation and permission-boundary case (duplicate emails, bad input, non-members,
wrong roles, missing/expired tokens), full task and project CRUD, stats accuracy, comments,
activity logging, malformed-JSON handling, and unknown routes — all verified via live HTTP
requests, not just read through. The frontend was verified with a strict TypeScript build
(`strict` + `noUncheckedIndexedAccess`), a clean production build, lint, and a live check
that every page and the dev/prod API proxying both work end-to-end against the backend.
# NOVA
