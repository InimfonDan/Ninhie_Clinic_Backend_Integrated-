/* =========================================================
   about.js — logic for about.html only.
   Depends on common.js being loaded first.
   ========================================================= */
(function () {
  "use strict";

  async function renderDepartments() {
    const el = document.getElementById("aboutDeptList");
    try {
      const doctors = await fetchDoctors();
      const depts = [...new Set(doctors.map((d) => d.department))].sort();

      if (depts.length === 0) {
        el.innerHTML = `<div class="empty-state"><span class="glyph">🩺</span>No departments set up yet.</div>`;
        return;
      }

      el.innerHTML = depts
        .map((dept) => {
          const count = doctors.filter((d) => d.department === dept).length;
          return `
        <div class="doctor-row">
          <div>
            <div class="doctor-name">${dept}</div>
            <div class="doctor-dept">${count} doctor${count === 1 ? "" : "s"}</div>
          </div>
        </div>`;
        })
        .join("");
    } catch (err) {
      el.innerHTML = `<div class="empty-state"><span class="glyph">⚠️</span>${err.message}</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", renderDepartments);
})();
