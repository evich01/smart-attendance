# Smart Attendance Management System

QR-code-based attendance system. MongoDB backend via Mongoose. **No GPS/location verification anywhere** — the sole anti-proxy mechanism is a 30-second rotating QR token.

Three roles: **Administrator**, **Lecturer**, **Student**. Single codebase runs as a cloud web app or an offline Electron desktop app — only `MONGODB_URI` changes.

---

## 1. Prerequisites

- Node.js 20+
- MongoDB running locally (`mongod`) **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env if needed — defaults point to a local mongod on port 27017
npm install
npm run seed     # creates demo admin/lecturer/student accounts + a sample course
npm run dev      # starts the API on http://localhost:5000
```

Demo accounts created by `npm run seed` (password for all: `Demo@1234`):

| Role      | Email               |
|-----------|----------------------|
| Admin     | admin@demo.edu       |
| Lecturer  | lecturer@demo.edu    |
| Student   | student@demo.edu     |

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev      # starts the app on http://localhost:5173
```

Open http://localhost:5173 and use the one-click demo buttons on the login screen, or sign in manually.

## 4. Offline / Electron desktop mode (optional)

```bash
cd frontend && npm run build      # produces frontend/dist
cd ../electron
npm install
MONGODB_URI="mongodb://localhost:27017/smart_attendance" npm start
```

This runs the same Express API + Mongoose models as a background process inside the Electron shell, serving the built frontend from disk. No code changes are needed between cloud and offline modes — only the `MONGODB_URI` environment variable differs.

For a fully portable offline demo with no local MongoDB install, consider bundling `mongodb-memory-server` (see Section 16 of the spec) — not included by default to keep the footprint small.

## 5. How the anti-proxy mechanism works (no GPS)

1. Lecturer starts a session → server issues a UUID token valid for 30 seconds.
2. QR code encodes `{ sessionId, token, courseCode }` only — never location.
3. Every 30 seconds the server rotates the token and the displayed QR code changes.
4. A screenshot or forwarded image becomes useless almost immediately, since the server rejects any expired token with `400 QR Expired`.
5. Validation on scan (`POST /api/attendance/scan`) runs five sequential checks — JWT identity, token match, expiry, enrollment, duplicate check-in — with **no location-based step**.

## 6. Project structure

```
smart-attendance-system/
├── backend/     Node/Express API + Mongoose models (MongoDB only)
├── frontend/    React 18 (Vite) + Tailwind CSS SPA
└── electron/    Offline desktop wrapper (optional)
```

See `backend/src/models/` for the full MongoDB schema (users, students, lecturers, courses, enrollments, attendanceSessions, attendanceRecords, settings, logs) and `backend/src/routes/` for the complete REST API surface.

## 7. Testing checklist

- [ ] Register/login for all three roles
- [ ] RBAC: each role can only access its permitted endpoints
- [ ] QR token expires after 30s and regenerates automatically
- [ ] Duplicate scan attempt → `409`
- [ ] Expired token scan → `400`
- [ ] Non-enrolled student scan → `403`
- [ ] CSV export produces the correct columns
- [ ] Analytics charts render with seeded data
- [ ] Responsive layout at 375px and 1440px
- [ ] Dark/light mode toggle persists
