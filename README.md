# Ninhie Clinic — Node.js + MongoDB Backend

This adds a real backend to your Ninhie Clinic front end. Before, everything
(patients, doctors, appointments, even the admin password) lived in the
browser's `localStorage` — data that only existed on one device, and that
anyone could edit by opening DevTools. Now the data lives in a MongoDB
database, and your frontend talks to it through a Node.js/Express API.

This README explains **what changed, why, and how it all fits together** —
not just the setup steps.

---

## 1. The big picture

```
┌─────────────────┐        HTTP requests        ┌──────────────────┐        ┌───────────┐
│   Frontend       │  ───────────────────────►   │   Backend         │  ───►  │  MongoDB  │
│  (HTML/CSS/JS,   │   e.g. POST /api/auth/login │  (Node + Express) │        │  Atlas    │
│  runs in browser)│  ◄───────────────────────   │                    │  ◄───  │           │
└─────────────────┘        JSON responses        └──────────────────┘        └───────────┘
```

- **Frontend** (`frontend/`) — your original HTML/CSS/JS, mostly untouched.
  The only real change is inside the `.js` files: anywhere they used to read
  or write `localStorage` directly, they now call a small set of helper
  functions (`fetchDoctors()`, `createAppointment()`, etc.) that send HTTP
  requests to the backend instead.
- **Backend** (`backend/`) — a Node.js server (Express) that exposes a REST
  API. It's the only thing allowed to talk to the database directly.
- **Database** — MongoDB Atlas (cloud-hosted MongoDB), storing four
  collections: `patients`, `doctors`, `appointments`, and `counters` (an
  internal helper, explained below).

The frontend **never** connects to MongoDB directly — it only ever talks to
your Express server, and the server is the only thing with the database
password. This is the standard three-tier setup (client → server →
database) and it's why things like the admin password can now be hidden
from the browser entirely.

---

## 2. Project structure

```
ninhie-clinic/
├── backend/
│   ├── models/              Mongoose schemas — the "shape" of each collection
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   └── Counter.js       generates friendly IDs like PT-0001, DR-0002…
│   ├── routes/               the actual API endpoints
│   │   ├── authRoutes.js     register / patient login / admin login
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   └── appointmentRoutes.js
│   ├── middleware/
│   │   └── auth.js           checks the login token on protected routes
│   ├── utils/
│   │   └── token.js          creates login tokens (JWTs)
│   ├── seed.js                fills the database with demo data
│   ├── server.js              entry point — starts everything
│   ├── package.json
│   └── .env.example           template for your real .env file
│
└── frontend/
    ├── css/styles.css         unchanged
    ├── js/
    │   ├── common.js          ⭐ talks to the API — read this first
    │   ├── about.js
    │   ├── admin-dashboard.js
    │   ├── book.js
    │   ├── cancel.js
    │   ├── directory.js
    │   ├── index.js
    │   ├── patient-dashboard.js
    │   ├── register.js
    │   └── schedule.js
    ├── about.html
    ├── admin-dashboard.html
    ├── book.html
    ├── cancel.html
    ├── directory.html
    ├── index.html
    ├── register.html
    ├── patient-dashboard.html
    └── schedule.html
```

> **Note:** One small fix was made to `register.html`: the phone number
> and emergency contact fields were `type="number"`, which causes browsers
> to silently strip a leading `0` (so `08031234567` becomes `8031234567`
> the moment it's read from the input) — that would break login, since
> the stored phone number keeps its leading zero. Both were changed to
> `type="tel"`, which keeps the exact digits typed while still showing a
> numeric keypad on mobile.

---

## 3. The database: what's stored, and how

Four MongoDB collections, each backed by a Mongoose **schema** (a set of
rules for what a valid document looks like — required fields, minimum
lengths, allowed values, etc.):

| Collection     | What it holds                                              | Friendly ID example |
|----------------|--------------------------------------------------------------|----------------------|
| `patients`     | Registered patients (name, contact info, **hashed** password) | `PT-0001` |
| `doctors`      | Doctors and their department                                  | `DR-0001` |
| `appointments` | Bookings, linked to a patient by their friendly ID             | `AP-0001` |
| `counters`     | Internal — just keeps track of "what's the next PT-/DR-/AP- number" |  — |

**Why the `counters` collection?** MongoDB automatically gives every
document a real ID (`_id`) like `65f1a2b3c4d5e6f7a8b9c0d1` — safe and
unique, but not the friendly `PT-0001` style your original app displayed.
`Counter.js` keeps one running number per type and hands out the next one
atomically (see the comments in that file for what "atomically" buys you).

---

## 4. How login and sessions work (the part that changed the most)

In the old version, `common.js` had `ADMIN_USERNAME` and `ADMIN_PASSWORD`
hardcoded in plain text — anyone could open DevTools and read them. Patient
passwords were stored in `localStorage` as plain text too.

**Now:**

1. **Passwords are hashed, never stored in plain text.** When a patient
   registers, the server runs their password through `bcrypt.hash()`
   (`backend/routes/authRoutes.js`), which scrambles it into something that
   can't be reversed back into the original — only *checked against*. When
   they log in, `bcrypt.compare()` re-does that scrambling on the submitted
   password and checks if it matches the stored hash. The real password is
   never saved anywhere, by anyone.

2. **The admin password lives in `.env` on the server**, not in any file the
   browser ever downloads. `POST /api/auth/admin-login` compares the
   submitted username/password against `process.env.ADMIN_USERNAME` /
   `process.env.ADMIN_PASSWORD` — values that exist only on your machine,
   never shipped to the browser.

3. **Logging in returns a JWT (JSON Web Token)** — a signed, tamper-proof
   string that encodes "who is this" (e.g. `{ role: "patient", patientId:
   "PT-0001", patientName: "Amara Okafor" }"`). The frontend stores this
   token in `localStorage` (as part of the `session` object) and attaches it
   to every future request as an `Authorization: Bearer <token>` header.

4. **The server checks that token on every protected route**
   (`backend/middleware/auth.js`). If it's missing, invalid, or expired,
   the request is rejected with `401 Unauthorized` — and `common.js`'s
   `apiRequest()` helper automatically logs the user out and sends them
   back to the login page when that happens.

5. **Ownership checks happen server-side, not just in the UI.** For
   example, `GET /api/appointments` doesn't trust a filter sent from the
   browser — it looks at *who the token says you are* and only returns
   that patient's own appointments (or everyone's, if you're an admin).
   A patient can no longer see or cancel someone else's booking just by
   editing a URL or a request body, since the server decides based on the
   token, not on anything the client claims.

---

## 5. What each API endpoint does

All routes are prefixed with `/api`. 🔒 = requires login. 🔒👑 = admin only. 🔒🧑 = patient only.

| Method | Endpoint                         | Purpose                                    |
|--------|-----------------------------------|---------------------------------------------|
| POST   | `/auth/register`                 | Create a patient account, returns a token |
| POST   | `/auth/login`                    | Patient login, returns a token             |
| POST   | `/auth/admin-login`              | Admin login, returns a token               |
| GET    | `/doctors`                       | List all doctors (public — no login needed)|
| POST   | `/doctors`                       | 🔒👑 Add a doctor                           |
| DELETE | `/doctors/:id`                   | 🔒👑 Remove a doctor                        |
| GET    | `/patients`                      | 🔒👑 List all patients (directory)          |
| GET    | `/appointments`                  | 🔒 List appointments (own, or all if admin) |
| POST   | `/appointments`                  | 🔒🧑 Book an appointment                    |
| PATCH  | `/appointments/:id/cancel`       | 🔒 Cancel (own, or any if admin)            |
| PATCH  | `/appointments/:id/approve`      | 🔒👑 Approve a pending appointment          |

Every response follows the same shape:
```json
{ "success": true, "message": "…", "data": { ... } }
```
or, on failure:
```json
{ "success": false, "message": "A clear explanation of what went wrong" }
```

---

## 6. Setup — step by step

### 6.1 Create a MongoDB Atlas database

1. Go to https://cloud.mongodb.com and sign in (or create a free account).
2. Create a project → create a free (M0) cluster.
3. Under **Database Access**, add a database user with a username and
   password (write these down — you'll need them below).
4. Under **Network Access**, add your current IP address (or `0.0.0.0/0` to
   allow any IP, fine for a school assignment — not for anything real).
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```
6. Replace `<username>` and `<password>` with your real values, and add a
   database name before the `?`, e.g.:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/ninhieClinic?appName=Cluster0
   ```

### 6.2 Configure and start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/ninhieClinic?appName=Cluster0
JWT_SECRET=some_long_random_string_you_make_up
ADMIN_USERNAME=Dan Inimfon
ADMIN_PASSWORD=@Scholar1
```

Then seed the database with demo doctors/patients/appointments (same demo
data your old `seedIfEmpty()` used to create):
```bash
npm run seed
```
You should see output ending in `Seed complete.` This creates 2 demo
patients — **login with phone `08031234567` or `08123456789`, password
`password123`** — and 9 doctors across 5 departments.

Finally, start the server:
```bash
npm start
```
You should see:
```
MongoDB connected successfully
Server running in development mode on http://localhost:5000
```
Leave this terminal running the whole time you're testing.

### 6.3 Run the frontend

The frontend is still just static files — no build step. The easiest way:
in VS Code, right-click `frontend/index.html` → **Open with Live Server**
(or any static file server). This usually opens it at something like
`http://127.0.0.1:5500`.

> If your frontend ends up on a different port than `5500`, that's fine —
> `common.js` talks to the backend at `http://localhost:5000` regardless of
> what port the frontend itself is running on. `cors()` in `server.js` is
> what allows this cross-origin communication.

### 6.4 Try it out

- Visit the Home page, click **Register or log in**.
- Register a new patient, or log in with the seeded demo account above.
- Book an appointment, view your dashboard, cancel it.
- Log out, then log in as admin via the footer link (**Staff login**),
  using the `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env`.
- As admin: add a doctor, view the Patient Directory, approve/cancel
  appointments from the Schedule page.

---

## 7. Testing the API directly (EchoAPI / Postman)

A few endpoints need a token, so the order matters:

1. **POST** `http://localhost:5000/api/auth/login`
   ```json
   { "loginId": "08031234567", "password": "password123" }
   ```
   Copy the `token` from the response.

2. For any 🔒 endpoint, add a header:
   ```
   Authorization: Bearer <paste the token here>
   ```

3. **GET** `http://localhost:5000/api/appointments` (with that header) →
   should return only Amara Okafor's appointments.

4. **POST** `http://localhost:5000/api/auth/admin-login`
   ```json
   { "username": "Dan Inimfon", "password": "@Scholar1" }
   ```
   Copy that token instead, and try **GET** `/api/patients` — this one
   will `403 Forbidden` with the patient's token, since it's admin-only.

---

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Error: read ECONNRESET` or "Could not reach the server" | Backend isn't running — run `npm start` in `backend/` |
| `MongoDB connection error` in the terminal | Wrong `MONGO_URI`, wrong password, or your IP isn't allow-listed in Atlas Network Access |
| Every page immediately redirects to Register | No valid session — log in again (tokens expire after 7 days, or `JWT_SECRET` changed) |
| `403 Forbidden` on an admin action | You're logged in as a patient, not an admin — log out and use Staff login |
| `400` "This doctor is already listed…" | You're re-adding a doctor+department pair that already exists — that's expected validation, not a bug |
| CORS error in the browser console | Backend isn't running, or you edited `API_BASE` in `common.js` to a wrong URL |

---

## 9. What's still simplified (be aware of this)

This is still a learning project, not production software. A few
intentional simplifications worth knowing about:

- **No email verification, no password reset.** Real apps would add both.
- **Any patient can register with any phone number** — there's no SMS/OTP
  step confirming they own that number.
- **JWTs can't be revoked early.** Logging out just deletes the token from
  the browser; the token itself would technically still work if someone
  else had a copy, until it naturally expires in 7 days. Production apps
  handle this with a server-side "blocklist" or shorter-lived tokens.
- **`0.0.0.0/0` in Atlas Network Access** (if you used it) allows connections
  from any IP in the world — convenient for testing, not something you'd
  want in a real deployment.

None of these affect how the assignment works, but they're worth
understanding if you build on this further.
