/* =========================================================
   admin-dashboard.js — logic for admin-dashboard.html only.
   Depends on common.js being loaded first.
   Protected page: admin only.
   ========================================================= */
(function () {
  "use strict";

  const session = requireRole("admin");
  if (!session) return;

  /* ---------------- Stats ---------------- */
  async function renderStats() {
    try {
      const [patients, appts] = await Promise.all([fetchPatients(), fetchAppointments()]);
      const pending = appts.filter((a) => a.status === "pending");
      const approved = appts.filter((a) => a.status === "approved");
      const cancelled = appts.filter((a) => a.status === "cancelled");

      document.getElementById("statRow").innerHTML = `
        <div class="stat-card"><div class="stat-num">${patients.length}</div><div class="stat-label">Registered patients</div></div>
        <div class="stat-card"><div class="stat-num">${appts.length}</div><div class="stat-label">Total booked</div></div>
        <div class="stat-card"><div class="stat-num">${pending.length}</div><div class="stat-label">Pending approval</div></div>
        <div class="stat-card"><div class="stat-num">${approved.length}</div><div class="stat-label">Approved</div></div>
        <div class="stat-card"><div class="stat-num">${cancelled.length}</div><div class="stat-label">Cancelled</div></div>
      `;
    } catch (err) {
      console.error(err);
    }
  }

  /* ---------------- Doctor management ---------------- */
  const doctorForm = document.getElementById("doctorForm");
  const doctorBanner = document.getElementById("doctorBanner");

  async function renderDoctorSuggestions() {
    try {
      const doctors = await fetchDoctors();
      const depts = [...new Set(doctors.map((d) => d.department))].sort();
      document.getElementById("deptSuggestions").innerHTML = depts.map((d) => `<option value="${d}">`).join("");
    } catch (err) {
      console.error(err);
    }
  }

  async function renderDoctorList() {
    const list = document.getElementById("doctorList");
    try {
      const doctors = (await fetchDoctors())
        .slice()
        .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));

      if (doctors.length === 0) {
        list.innerHTML = `<div class="empty-state"><span class="glyph">🩺</span>No doctors added yet.</div>`;
        return;
      }
      list.innerHTML = doctors
        .map(
          (d) => `
        <div class="doctor-row">
          <div>
            <div class="doctor-name">${d.name}</div>
            <div class="doctor-dept">${d.department}</div>
          </div>
          <button class="btn btn-danger btn-sm" data-remove-doctor="${d.id}">Remove</button>
        </div>
      `
        )
        .join("");
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><span class="glyph">⚠️</span>${err.message}</div>`;
    }
  }

  doctorForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById("new-doctor-name").value.trim();
    const dept = document.getElementById("new-doctor-dept").value.trim();

    if (name.length < 3) { setError("f-doctor-name", true); valid = false; } else setError("f-doctor-name", false);
    if (dept.length < 2) { setError("f-doctor-dept", true); valid = false; } else setError("f-doctor-dept", false);
    if (!valid) {
      showBanner(doctorBanner, "error", "Please fix the highlighted fields before continuing.");
      return;
    }

    try {
      const res = await addDoctor({ name, department: dept });
      showBanner(doctorBanner, "success", res.message);
      doctorForm.reset();
      await renderDoctorSuggestions();
      await renderDoctorList();
    } catch (err) {
      showBanner(doctorBanner, "error", err.message);
    }
  });

  document.addEventListener("click", async function (e) {
    const btn = e.target.closest("[data-remove-doctor]");
    if (!btn) return;
    const id = btn.dataset.removeDoctor;
    if (!confirm(`Remove this doctor?`)) return;
    try {
      await removeDoctor(id);
      await renderDoctorSuggestions();
      await renderDoctorList();
    } catch (err) {
      showBanner(doctorBanner, "error", err.message);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    renderStats();
    renderDoctorSuggestions();
    renderDoctorList();
  });
})();
