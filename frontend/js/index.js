/* =========================================================
   index.js — logic for index.html (Home) only.
   Depends on common.js being loaded first.

   Unchanged from the original: this page only reads the logged-in
   session (still kept in localStorage), it doesn't touch patients,
   doctors, or appointments, so there's no API call needed here.
   ========================================================= */
(function () {
  "use strict";

  function renderHeroCta() {
    const session = getSession();
    const cta = document.getElementById("heroCta");
    if (session && session.role === "patient") {
      cta.innerHTML = `
        <a class="btn btn-primary" href="patient-dashboard.html">Go to my dashboard</a>
        <a class="btn btn-ghost" href="book.html">Book an appointment</a>`;
    } else if (session && session.role === "admin") {
      cta.innerHTML = `
        <a class="btn btn-primary" href="admin-dashboard.html">Go to admin dashboard</a>
        <a class="btn btn-ghost" href="directory.html">Patient directory</a>`;
    } else {
      cta.innerHTML = `
        <a class="btn btn-primary" href="register.html">Register or log in</a>
        <a class="btn btn-ghost" href="about.html">About us</a>`;
    }
  }

  document.addEventListener("DOMContentLoaded", renderHeroCta);
})();
