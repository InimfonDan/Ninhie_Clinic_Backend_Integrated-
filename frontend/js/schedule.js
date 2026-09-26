/* =========================================================
   schedule.js — logic for schedule.html only.
   Depends on common.js being loaded first.
   Protected page: patient OR admin, content differs by role.
   ========================================================= */
(function () {
  "use strict";

  const session = requireAnyRole();
  if (!session) return;

  const isAdmin = session.role === "admin";

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("scheduleEyebrow").textContent = isAdmin ? "Admin · All Appointments" : "My Schedule";
    document.getElementById("scheduleTitle").textContent = isAdmin ? "All appointments" : "My appointment schedule";
    document.getElementById("scheduleSub").textContent = isAdmin
      ? "Every booking on file. Approve or cancel directly from this table."
      : "Every appointment you've booked, its live status.";
  });

  const scheduleSearch = document.getElementById("scheduleSearch");
  const scheduleFilter = document.getElementById("scheduleFilter");

  async function renderSchedule() {
    const q = scheduleSearch.value.trim().toLowerCase();
    const filter = scheduleFilter.value;

    try {
      // fetchAppointments() returns everyone's for an admin, or just this
      // patient's for a patient — decided server-side from the login token.
      let appts = await fetchAppointments();
      appts = appts.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

      if (filter !== "all") appts = appts.filter((a) => a.status === filter);
      if (q) {
        appts = appts.filter(
          (a) =>
            a.patientName.toLowerCase().includes(q) ||
            a.doctor.toLowerCase().includes(q) ||
            a.department.toLowerCase().includes(q) ||
            a.date.includes(q) ||
            a.id.toLowerCase().includes(q)
        );
      }

      const body = document.getElementById("scheduleTableBody");
      document.getElementById("scheduleEmpty").style.display = appts.length ? "none" : "block";

      body.innerHTML = appts
        .map((a) => {
          let actions = "";
          if (isAdmin) {
            if (a.status === "pending") {
              actions = `<div class="action-group">
              <button class="btn btn-approve btn-sm" data-approve-id="${a.id}">Approve</button>
              <button class="btn btn-danger btn-sm" data-cancel-id="${a.id}">Cancel</button>
            </div>`;
            } else if (a.status === "approved") {
              actions = `<div class="action-group"><button class="btn btn-danger btn-sm" data-cancel-id="${a.id}">Cancel</button></div>`;
            }
          } else if (a.status !== "cancelled") {
            actions = `<button class="btn btn-danger btn-sm" data-cancel-id="${a.id}">Cancel</button>`;
          }
          return `
        <tr>
          <td class="mono">${a.id}</td>
          <td>${a.patientName}</td>
          <td>${a.department}</td>
          <td>${a.doctor}</td>
          <td class="reason-cell" title="${(a.reason || "").replace(/"/g, "&quot;")}">${a.reason ? (a.reason.length > 40 ? a.reason.slice(0, 40) + "…" : a.reason) : "—"}</td>
          <td>${formatDate(a.date)}, ${formatTime(a.time)}</td>
          <td><span class="pill ${a.status}">${a.status}</span></td>
          <td>${actions}</td>
        </tr>`;
        })
        .join("");
    } catch (err) {
      console.error(err);
    }
  }

  scheduleSearch.addEventListener("input", renderSchedule);
  scheduleFilter.addEventListener("change", renderSchedule);
  document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) scheduleSearch.value = q;
    renderSchedule();
  });

  wireCancelButtons(renderSchedule);
  wireApproveButtons(renderSchedule);
})();
