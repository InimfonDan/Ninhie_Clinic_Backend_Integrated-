/* =========================================================
   cancel.js — logic for cancel.html only.
   Depends on common.js being loaded first.
   Protected page: patients only.
   ========================================================= */
(function () {
  "use strict";

  const session = requireRole("patient");
  if (!session) return;

  const cancelSearch = document.getElementById("cancelSearch");
  const cancelBanner = document.getElementById("cancelBanner");

  async function renderCancelList() {
    const q = cancelSearch.value.trim().toLowerCase();
    try {
      // fetchAppointments() already returns only THIS patient's
      // appointments — the server filters by the logged-in token.
      let appts = (await fetchAppointments())
        .filter((a) => a.status !== "cancelled")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

      if (q) {
        appts = appts.filter(
          (a) =>
            a.doctor.toLowerCase().includes(q) ||
            a.department.toLowerCase().includes(q) ||
            a.id.toLowerCase().includes(q)
        );
      }

      const list = document.getElementById("cancelTicketList");
      document.getElementById("cancelEmpty").style.display = appts.length ? "none" : "block";
      list.innerHTML = appts.map((a) => ticketHTML(a, true)).join("");
    } catch (err) {
      showBanner(cancelBanner, "error", err.message);
    }
  }

  cancelSearch.addEventListener("input", renderCancelList);
  document.addEventListener("DOMContentLoaded", renderCancelList);

  wireCancelButtons(function (appt) {
    showBanner(cancelBanner, "success", `Appointment ${appt.id} has been cancelled.`);
    renderCancelList();
  });
})();
