/* =========================================================
   patient-dashboard.js — logic for patient-dashboard.html only.
   Depends on common.js being loaded first.
   Protected page: patients only.
   ========================================================= */
(function () {
  "use strict";

  const session = requireRole("patient");
  if (!session) return;

  async function renderDashboard() {
    try {
      // Already scoped to this patient only, by the server.
      const myAppts = await fetchAppointments();
      const pending = myAppts.filter((a) => a.status === "pending");
      const approved = myAppts.filter((a) => a.status === "approved");
      const cancelled = myAppts.filter((a) => a.status === "cancelled");

      document.getElementById("statRow").innerHTML = `
        <div class="stat-card"><div class="stat-num">${myAppts.length}</div><div class="stat-label">Total booked</div></div>
        <div class="stat-card"><div class="stat-num">${pending.length}</div><div class="stat-label">Pending approval</div></div>
        <div class="stat-card"><div class="stat-num">${approved.length}</div><div class="stat-label">Approved</div></div>
        <div class="stat-card"><div class="stat-num">${cancelled.length}</div><div class="stat-label">Cancelled</div></div>
      `;

      const upcoming = myAppts
        .filter((a) => a.status !== "cancelled")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 6);

      const list = document.getElementById("upcomingTicketList");
      if (upcoming.length === 0) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span class="glyph">🕊️</span>No upcoming appointments — book one to see it here.</div>`;
      } else {
        list.innerHTML = upcoming.map((a) => ticketHTML(a, false)).join("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("welcomeEyebrow").textContent = `Welcome, ${session.patientName}`;
    renderDashboard();
  });
})();
