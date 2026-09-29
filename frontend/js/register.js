/* =========================================================
   register.js — logic for register.html only.
   Depends on common.js being loaded first.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Tab switching (Register / Patient Login) ---------------- */
  const tabButtons = document.querySelectorAll(".auth-tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      tabButtons.forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".auth-panel")
        .forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document
        .getElementById("panel-" + btn.dataset.tab)
        .classList.add("active");
    });
  });

  /* ---------------- Admin login: footer link <-> back link ---------------- */
  const authTabs = document.getElementById("authTabs");
  const panelAdmin = document.getElementById("panel-adminLogin");
  const adminBackLink = document.getElementById("adminBackLink");

  function showAdminPanel(e) {
    if (e) e.preventDefault();
    tabButtons.forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".auth-panel")
      .forEach((p) => p.classList.remove("active"));
    panelAdmin.classList.add("active");
    authTabs.style.display = "none";
  }

  function showPatientTabs(e) {
    if (e) e.preventDefault();
    panelAdmin.classList.remove("active");
    authTabs.style.display = "flex";
    tabButtons.forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".auth-panel")
      .forEach((p) => p.classList.remove("active"));
    document.querySelector('[data-tab="register"]').classList.add("active");
    document.getElementById("panel-register").classList.add("active");
  }

  adminBackLink.addEventListener("click", showPatientTabs);

  if (window.location.hash === "#admin-login") showAdminPanel();

  /* ================= REGISTER ================= */
  const registerForm = document.getElementById("registerForm");
  const registerBanner = document.getElementById("registerBanner");

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById("p-name").value.trim();
    const dob = document.getElementById("p-dob").value;
    const gender = document.getElementById("p-gender").value;
    const phone = document.getElementById("p-phone").value.trim();
    const email = document.getElementById("p-email").value.trim();
    const address = document.getElementById("p-address").value.trim();
    const blood = document.getElementById("p-blood").value;
    const emergency = document.getElementById("p-emergency").value.trim();
    const password = document.getElementById("p-password").value;
    const password2 = document.getElementById("p-password2").value;

    if (name.length < 3) {
      setError("f-name", true);
      valid = false;
    } else setError("f-name", false);
    if (!dob || new Date(dob) >= new Date()) {
      setError("f-dob", true);
      valid = false;
    } else setError("f-dob", false);
    if (!gender) {
      setError("f-gender", true);
      valid = false;
    } else setError("f-gender", false);
    if (!isValidPhone(phone)) {
      setError("f-phone", true);
      valid = false;
    } else setError("f-phone", false);
    if (email && !isValidEmail(email)) {
      setError("f-email", true);
      valid = false;
    } else setError("f-email", false);
    if (address.length < 5) {
      setError("f-address", true);
      valid = false;
    } else setError("f-address", false);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError("f-password", true);
      valid = false;
    } else setError("f-password", false);
    if (password !== password2 || password2.length === 0) {
      setError("f-password2", true);
      valid = false;
    } else setError("f-password2", false);

    if (!valid) {
      showBanner(
        registerBanner,
        "error",
        "Please fix the highlighted fields before continuing.",
      );
      return;
    }

    // The same rules are checked again on the server (backend/routes/authRoutes.js),
    // since a request could be sent directly to the API, skipping this form entirely.
    try {
      const res = await registerPatient({
        name,
        dob,
        gender,
        phone,
        email,
        address,
        blood,
        emergency,
        password,
        password2,
      });
      // Save the session INCLUDING the token — every future request needs it.
      setSession({ ...res.session, token: res.token });
      showBanner(
        registerBanner,
        "success",
        `Welcome, ${res.session.patientName}! Redirecting to your dashboard…`,
      );
      setTimeout(() => {
        window.location.href = "patient-dashboard.html";
      }, 900);
    } catch (err) {
      showBanner(registerBanner, "error", err.message);
    }
  });

  /* ================= PATIENT LOGIN ================= */
  const patientLoginForm = document.getElementById("patientLoginForm");
  const patientLoginBanner = document.getElementById("patientLoginBanner");

  patientLoginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    let valid = true;

    const loginId = document.getElementById("login-id").value.trim();
    const password = document.getElementById("login-password").value;

    if (!loginId) {
      setError("f-login-id", true);
      valid = false;
    } else setError("f-login-id", false);
    if (!password) {
      setError("f-login-password", true);
      valid = false;
    } else setError("f-login-password", false);
    if (!valid) return;

    try {
      const res = await loginPatient({ loginId, password });
      setSession({ ...res.session, token: res.token });
      showBanner(
        patientLoginBanner,
        "success",
        `Welcome back, ${res.session.patientName}! Redirecting…`,
      );
      setTimeout(() => {
        window.location.href = "patient-dashboard.html";
      }, 700);
    } catch (err) {
      showBanner(patientLoginBanner, "error", err.message);
    }
  });

  /* ================= ADMIN LOGIN ================= */
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminLoginBanner = document.getElementById("adminLoginBanner");

  adminLoginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    let valid = true;

    const username = document.getElementById("admin-username").value.trim();
    const password = document.getElementById("admin-password").value;

    if (!username) {
      setError("f-admin-username", true);
      valid = false;
    } else setError("f-admin-username", false);
    if (!password) {
      setError("f-admin-password", true);
      valid = false;
    } else setError("f-admin-password", false);
    if (!valid) return;

    try {
      const res = await adminLogin({ username, password });
      setSession({ ...res.session, token: res.token });
      showBanner(
        adminLoginBanner,
        "success",
        "Welcome back! Redirecting to the admin dashboard…",
      );
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 700);
    } catch (err) {
      showBanner(adminLoginBanner, "error", err.message);
    }
  });

  /* If already logged in, no need to be on this page. */
  document.addEventListener("DOMContentLoaded", function () {
    const session = getSession();
    if (
      session &&
      session.role === "patient" &&
      window.location.hash !== "#admin-login"
    )
      window.location.href = "patient-dashboard.html";
    if (session && session.role === "admin")
      window.location.href = "admin-dashboard.html";
  });
})();
