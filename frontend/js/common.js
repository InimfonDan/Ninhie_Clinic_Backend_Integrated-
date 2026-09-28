/* =========================================================
   Ninhie Clinic — common.js
   Shared across every page. Load this BEFORE any page script.

   WHAT CHANGED FROM THE LOCALSTORAGE VERSION:
   Patients, doctors, and appointments used to be arrays saved straight
   into the browser's localStorage. Now they live in MongoDB, and this
   file talks to your Node/Express API to read and write them instead.
   The only thing still kept in localStorage is the logged-in user's
   SESSION (their name/role + login token) — that's a small, per-browser
   convenience, not the actual data.
   ========================================================= */

/* ---------------- API configuration ---------------- */

// Change this if your backend runs on a different port or host.
const API_BASE = "https://ninhie-clinic-backend.vercel.app/api";

const SESSION_KEY = "ninhie_session";

/* ---------------- Session / auth ---------------- */
// A "session" here is: { role, patientId?, patientName?, token }.
// `token` is the JWT the backend issued at login — it's what proves to
// the server "yes, this really is that logged-in patient/admin" on every
// request that follows. See README.md → "How login and sessions work".

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (e) {
    return null;
  }
}
function setSession(obj) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(obj));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function logout() {
  clearSession();
  window.location.href = "index.html";
}

/* Redirects to register.html unless the visitor is logged in with
   the exact role given. Call at the very top of a protected page. */
function requireRole(role) {
  const session = getSession();
  if (!session || session.role !== role) {
    window.location.href = "register.html";
    return null;
  }
  return session;
}

/* Redirects to register.html unless the visitor is logged in as
   EITHER role — used by pages both patient and admin can view
   (like Schedule), where the content differs by role. */
function requireAnyRole() {
  const session = getSession();
  if (!session) {
    window.location.href = "register.html";
    return null;
  }
  return session;
}

/* ---------------- API request helper ----------------
   Every function below (fetchDoctors, createAppointment, etc.) goes
   through this one wrapper, so the "attach the login token" and
   "handle errors sensibly" logic only has to be written once. */
async function apiRequest(path, options = {}) {
  const session = getSession();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // If we're logged in, attach the token so the server knows who's asking.
  // This is the "Authorization: Bearer <token>" header the auth middleware
  // in backend/middleware/auth.js reads.
  if (session && session.token) {
    headers.Authorization = "Bearer " + session.token;
  }

  let response;
  try {
    response = await fetch(API_BASE + path, { ...options, headers });
  } catch (networkError) {
    // fetch() itself throws when it can't reach the server at all
    // (server not running, wrong port, no internet, etc.)
    throw new Error(
      "Could not reach the server. Make sure your backend is running (npm start) on http://localhost:5000.",
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // Response wasn't JSON — leave data as {} and fall through.
  }

  // 401 means our session is invalid or expired — send the user back to
  // log in rather than showing a confusing error.
  if (response.status === 401) {
    clearSession();
    window.location.href = "register.html";
    throw new Error(
      data.message || "Your session has expired. Please log in again.",
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

/* ---------------- Doctors ---------------- */
async function fetchDoctors() {
  const res = await apiRequest("/doctors");
  return res.data;
}
async function addDoctor(payload) {
  return apiRequest("/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
async function removeDoctor(id) {
  return apiRequest("/doctors/" + id, { method: "DELETE" });
}
async function distinctDepartments() {
  const doctors = await fetchDoctors();
  return [...new Set(doctors.map((d) => d.department))].sort();
}

/* ---------------- Patients ---------------- */
async function fetchPatients() {
  const res = await apiRequest("/patients");
  return res.data;
}

/* ---------------- Appointments ----------------
   Note: fetchAppointments() automatically returns only the logged-in
   patient's own appointments for a patient, or ALL appointments for an
   admin — that filtering happens server-side based on the login token,
   so the frontend doesn't need to (and can't be tricked into) ask for
   someone else's data. */
async function fetchAppointments() {
  const res = await apiRequest("/appointments");
  return res.data;
}
async function createAppointment(payload) {
  return apiRequest("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
async function cancelAppointment(id) {
  return apiRequest(`/appointments/${id}/cancel`, { method: "PATCH" });
}
async function approveAppointment(id) {
  return apiRequest(`/appointments/${id}/approve`, { method: "PATCH" });
}

/* ---------------- Auth ---------------- */
async function registerPatient(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
async function loginPatient(payload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
async function adminLogin(payload) {
  return apiRequest("/auth/admin-login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------------- Reference data ---------------- */
const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
];

/* ---------------- Validation helpers ---------------- */
function setError(fieldId, isError) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle("error", isError);
}
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v) {
  return /^[0-9+\-\s()]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;
}

function showBanner(el, kind, msg) {
  el.className = "banner show " + kind;
  el.textContent = msg;
  setTimeout(() => {
    el.classList.remove("show");
  }, 4500);
}

/* ---------------- Formatting helpers ---------------- */
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* ---------------- Ticket-stub card renderer ---------------- */
function ticketHTML(a, showCancel) {
  const [h, m] = a.time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const canCancel = showCancel && a.status !== "cancelled";
  return `
  <div class="ticket">
    <div class="ticket-main">
      <div class="ticket-id">${a.id}</div>
      <div class="ticket-patient">${a.patientName}</div>
      <div class="ticket-meta">${a.department} · ${a.doctor}</div>
      <div class="ticket-date">${formatDate(a.date)}</div>
      <div class="ticket-status"><span class="pill ${a.status}">${a.status}</span></div>
      ${canCancel ? `<div class="ticket-actions"><button class="btn btn-danger btn-sm" data-cancel-id="${a.id}">Cancel</button></div>` : ""}
    </div>
    <div class="ticket-perf"></div>
    <div class="ticket-stub">
      <div class="time">${h12}:${String(m).padStart(2, "0")}</div>
      <div class="ampm">${ampm}</div>
    </div>
  </div>`;
}

/* ---------------- Shared action-button wiring (event delegation) ----------------
   These now call the API instead of editing a local array. Because
   button clicks can happen on a page after data was fetched, we use
   event delegation on `document` — same pattern as before — but the
   handlers are now `async` so they can `await` the network request. */
function wireCancelButtons(afterCancel) {
  document.addEventListener("click", async function (e) {
    const btn = e.target.closest("[data-cancel-id]");
    if (!btn) return;
    const id = btn.dataset.cancelId;
    if (!confirm(`Cancel appointment ${id}?`)) return;
    try {
      const res = await cancelAppointment(id);
      if (typeof afterCancel === "function") afterCancel(res.data);
    } catch (err) {
      alert(err.message);
    }
  });
}
function wireApproveButtons(afterApprove) {
  document.addEventListener("click", async function (e) {
    const btn = e.target.closest("[data-approve-id]");
    if (!btn) return;
    const id = btn.dataset.approveId;
    try {
      const res = await approveAppointment(id);
      if (typeof afterApprove === "function") afterApprove(res.data);
    } catch (err) {
      alert(err.message);
    }
  });
}

/* ---------------- Sidebar / mobile nav ----------------
   Unchanged — this only depends on the logged-in session, not on any
   data from the API. */
function navItems(session) {
  const items = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "about", label: "About", href: "about.html" },
  ];

  if (session && session.role === "patient") {
    items.push({
      key: "patient-dashboard",
      label: "My Dashboard",
      href: "patient-dashboard.html",
    });
    items.push({ key: "book", label: "Book Appointment", href: "book.html" });
    items.push({
      key: "schedule",
      label: "My Schedule",
      href: "schedule.html",
    });
    items.push({
      key: "cancel",
      label: "Cancel Appointment",
      href: "cancel.html",
    });
  }
  if (session && session.role === "admin") {
    items.push({
      key: "admin-dashboard",
      label: "Admin Dashboard",
      href: "admin-dashboard.html",
    });
    items.push({
      key: "schedule",
      label: "All Appointments",
      href: "schedule.html",
    });
    items.push({
      key: "directory",
      label: "Patient Directory",
      href: "directory.html",
    });
  }
  if (!session) {
    items.push({
      key: "register",
      label: "Register / Login",
      href: "register.html",
    });
  }
  return items;
}

function renderChrome() {
  const session = getSession();
  const page = document.body.dataset.page;
  const items = navItems(session);

  const navHTML = items
    .map(
      (i) =>
        `<a class="nav-btn${i.key === page ? " active" : ""}" href="${i.href}">${i.label}</a>`,
    )
    .join("");

  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    let sessionBoxHTML = "";
    if (session) {
      const label =
        session.role === "admin" ? "Admin" : session.patientName || "Patient";
      sessionBoxHTML = `
        <div class="session-box">
          <div class="who">${label}</div>
          <span class="role-tag">${session.role}</span>
          <button class="btn btn-ghost btn-sm" id="logoutBtn">Log out</button>
        </div>`;
    }
    sidebar.innerHTML = `
      <div class="brand">
        <span class="mark"></span>
        <div>
          <div class="brand-text">Ninhie</div>
          <div class="brand-sub">Clinic Desk</div>
        </div>
      </div>
      <nav class="primary-nav">${navHTML}</nav>
      ${sessionBoxHTML}
    `;
  }

  const topbar = document.getElementById("mobileTopbar");
  if (topbar) {
    topbar.innerHTML = `
      <div class="brand"><span class="mark"></span><span class="brand-text">Ninhie</span></div>
      <span class="brand-sub" style="margin:0;">Clinic Desk</span>
    `;
  }

  const tabbar = document.getElementById("mobileTabbar");
  if (tabbar) {
    let tabItems = items.slice();
    if (session) {
      tabItems = tabItems.concat([
        { key: "logout", label: "Logout", href: "#", logout: true },
      ]);
    }
    tabbar.innerHTML = tabItems
      .map((i) =>
        i.logout
          ? `<button class="tab-btn" id="tabLogoutBtn"><span class="tab-dot"></span>Logout</button>`
          : `<a class="tab-btn${i.key === page ? " active" : ""}" href="${i.href}"><span class="tab-dot"></span>${i.label.split(" ")[0]}</a>`,
      )
      .join("");
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  const tabLogoutBtn = document.getElementById("tabLogoutBtn");
  if (tabLogoutBtn) tabLogoutBtn.addEventListener("click", logout);
}

/* Demo data no longer needs seeding here on page load — it now lives in
   MongoDB, seeded once via `npm run seed` in the backend. See README.md. */

document.addEventListener("DOMContentLoaded", renderChrome);
