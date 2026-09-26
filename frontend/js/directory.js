/* =========================================================
   directory.js — logic for directory.html only.
   Depends on common.js being loaded first.
   Protected page: admin only.
   ========================================================= */
(function () {
  "use strict";

  const session = requireRole("admin");
  if (!session) return;

  const directorySearch = document.getElementById("directorySearch");

  async function renderDirectory() {
    const q = directorySearch.value.trim().toLowerCase();
    try {
      // fetchPatients() already includes each patient's appointmentCount,
      // computed server-side in backend/routes/patientRoutes.js.
      let patients = (await fetchPatients()).slice().sort((a, b) => a.name.localeCompare(b.name));
      if (q) {
        patients = patients.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.phone.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        );
      }
      const body = document.getElementById("directoryTableBody");
      document.getElementById("directoryEmpty").style.display = patients.length ? "none" : "block";

      body.innerHTML = patients
        .map(
          (p) => `
    <tr>
      <td class="mono">${p.id}</td>
      <td>${p.name}</td>
      <td>${p.gender}</td>
      <td>${formatDate(p.dob)}</td>
      <td>${p.blood || "Unknown"}</td>
      <td>${p.phone}</td>
      <td>${p.email || "—"}</td>
      <td>${p.appointmentCount}</td>
      <td><a class="btn btn-ghost btn-sm" href="schedule.html?q=${encodeURIComponent(p.name)}">View appointments</a></td>
    </tr>`
        )
        .join("");
    } catch (err) {
      console.error(err);
    }
  }

  directorySearch.addEventListener("input", renderDirectory);
  document.addEventListener("DOMContentLoaded", renderDirectory);
})();
