/* =========================================================
   book.js — logic for book.html only.
   Depends on common.js being loaded first.
   Protected page: patients only.
   ========================================================= */
(function () {
  "use strict";

  const session = requireRole("patient");
  if (!session) return;

  const bookForm = document.getElementById("bookForm");
  const bookBanner = document.getElementById("bookBanner");
  const deptSelect = document.getElementById("b-dept");
  const doctorSelect = document.getElementById("b-doctor");
  const dateInput = document.getElementById("b-date");
  const timeSelect = document.getElementById("b-time");

  let allDoctors = [];

  async function populateDepartments() {
    try {
      allDoctors = await fetchDoctors();
      const depts = [...new Set(allDoctors.map((d) => d.department))].sort();
      deptSelect.innerHTML = '<option value="">Select…</option>' + depts.map((d) => `<option>${d}</option>`).join("");
    } catch (err) {
      showBanner(bookBanner, "error", err.message);
    }
  }
  function populateTimeSlots() {
    timeSelect.innerHTML = '<option value="">Select…</option>' + TIME_SLOTS.map((t) => `<option>${t}</option>`).join("");
  }

  deptSelect.addEventListener("change", function () {
    const dept = deptSelect.value;
    const docs = allDoctors.filter((d) => d.department === dept).map((d) => d.name);
    doctorSelect.innerHTML = docs.length
      ? '<option value="">Select…</option>' + docs.map((d) => `<option>${d}</option>`).join("")
      : '<option value="">No doctors in this department yet…</option>';
  });

  bookForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    let valid = true;

    const dept = deptSelect.value;
    const doctor = doctorSelect.value;
    const date = dateInput.value;
    const time = timeSelect.value;
    const reason = document.getElementById("b-reason").value.trim();

    if (!dept) { setError("f-dept", true); valid = false; } else setError("f-dept", false);
    if (!doctor) { setError("f-doctor", true); valid = false; } else setError("f-doctor", false);

    let dateOk = true;
    if (!date) {
      dateOk = false;
    } else {
      const chosen = new Date(date + "T00:00:00");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const day = chosen.getDay();
      if (chosen < today || day === 0 || day === 6) dateOk = false;
    }
    if (!dateOk) { setError("f-date", true); valid = false; } else setError("f-date", false);
    if (!time) { setError("f-time", true); valid = false; } else setError("f-time", false);

    if (!valid) {
      showBanner(bookBanner, "error", "Please fix the highlighted fields before continuing.");
      return;
    }

    // Double-booking is also checked server-side (the real, trustworthy
    // check) — this request will fail with a clear message if it clashes.
    try {
      const res = await createAppointment({ department: dept, doctor, date, time, reason });
      showBanner(
        bookBanner,
        "success",
        `Request sent — ${doctor} on ${formatDate(date)} at ${formatTime(time)}. Reference ${res.data.id}. Status: Pending approval.`
      );
      bookForm.reset();
      populateTimeSlots();
      doctorSelect.innerHTML = '<option value="">Select department first…</option>';
    } catch (err) {
      showBanner(bookBanner, "error", err.message);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    dateInput.min = new Date().toISOString().split("T")[0];
    populateDepartments();
    populateTimeSlots();
  });
})();
