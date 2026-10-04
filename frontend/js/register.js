/* =========================================================
   register.js — logic for register.html only.
   Depends on common.js being loaded first.
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     REGISTER / LOGIN TAB SWITCHING
     ========================================================= */

  const tabButtons = document.querySelectorAll(".auth-tab-btn");

  const authPanels = document.querySelectorAll(".auth-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const selectedTab = btn.dataset.tab;

      // Remove active class from all tabs
      tabButtons.forEach((button) => {
        button.classList.remove("active");
      });

      // Remove active class from all panels
      authPanels.forEach((panel) => {
        panel.classList.remove("active");
      });

      // Activate clicked tab
      btn.classList.add("active");

      // Activate corresponding panel
      const selectedPanel = document.getElementById("panel-" + selectedTab);

      if (selectedPanel) {
        selectedPanel.classList.add("active");
      }
    });
  });

  /* =========================================================
     REGISTER
     ========================================================= */

  const registerForm = document.getElementById("registerForm");

  const registerBanner = document.getElementById("registerBanner");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      let valid = true;

      /* -----------------------------------------------------
           Get form values
           ----------------------------------------------------- */

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

      /* -----------------------------------------------------
           Validate name
           ----------------------------------------------------- */

      if (name.length < 3) {
        setError("f-name", true);

        valid = false;
      } else {
        setError("f-name", false);
      }

      /* -----------------------------------------------------
           Validate date of birth
           ----------------------------------------------------- */

      if (!dob || new Date(dob) >= new Date()) {
        setError("f-dob", true);

        valid = false;
      } else {
        setError("f-dob", false);
      }

      /* -----------------------------------------------------
           Validate gender
           ----------------------------------------------------- */

      if (!gender) {
        setError("f-gender", true);

        valid = false;
      } else {
        setError("f-gender", false);
      }

      /* -----------------------------------------------------
           Validate phone
           ----------------------------------------------------- */

      if (!isValidPhone(phone)) {
        setError("f-phone", true);

        valid = false;
      } else {
        setError("f-phone", false);
      }

      /* -----------------------------------------------------
           Validate email
           ----------------------------------------------------- */

      if (email && !isValidEmail(email)) {
        setError("f-email", true);

        valid = false;
      } else {
        setError("f-email", false);
      }

      /* -----------------------------------------------------
           Validate address
           ----------------------------------------------------- */

      if (address.length < 5) {
        setError("f-address", true);

        valid = false;
      } else {
        setError("f-address", false);
      }

      /* -----------------------------------------------------
           Validate password
           ----------------------------------------------------- */

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;

      if (!passwordRegex.test(password)) {
        setError("f-password", true);

        valid = false;
      } else {
        setError("f-password", false);
      }

      /* -----------------------------------------------------
           Confirm password
           ----------------------------------------------------- */

      if (password !== password2 || password2.length === 0) {
        setError("f-password2", true);

        valid = false;
      } else {
        setError("f-password2", false);
      }

      /* -----------------------------------------------------
           Stop if validation fails
           ----------------------------------------------------- */

      if (!valid) {
        showBanner(
          registerBanner,
          "error",
          "Please fix the highlighted fields before continuing.",
        );

        return;
      }

      /* =====================================================
           SEND REGISTRATION TO BACKEND
           ===================================================== */

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

        /* ---------------------------------------------------
             Save session
             --------------------------------------------------- */

        setSession({
          ...res.session,
          token: res.token,
        });

        /* ---------------------------------------------------
             Success message
             --------------------------------------------------- */

        showBanner(
          registerBanner,
          "success",
          `Welcome, ${res.session.patientName}! Redirecting to your dashboard…`,
        );

        /* ---------------------------------------------------
             Redirect to patient dashboard
             --------------------------------------------------- */

        setTimeout(() => {
          window.location.href = "patient-dashboard.html";
        }, 900);
      } catch (err) {
        showBanner(registerBanner, "error", err.message);
      }
    });
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  const ROLE_ROUTES = {
    patient: "patient-dashboard.html",

    admin: "admin-dashboard.html",

    // doctor: "doctor-dashboard.html",

    // nurse: "nurse-dashboard.html",
  };

  function redirectByRole(role) {
    const page = ROLE_ROUTES[role];

    if (!page) {
      clearSession();

      window.location.href = "register.html";

      return;
    }

    window.location.href = page;
  }

  const loginForm = document.getElementById("loginForm");

  const loginBanner = document.getElementById("loginBanner");

  /* =========================================================
     CHECK EXISTING SESSION
     ========================================================= */

  const existing = getSession();

  if (existing && existing.token) {
    redirectByRole(existing.role);
  }

  /* =========================================================
     LOGIN FORM SUBMISSION
     ========================================================= */

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      let valid = true;

      /* -----------------------------------------------------
           Get login values
           ----------------------------------------------------- */

      const loginId = document.getElementById("login-id").value.trim();

      const password = document.getElementById("login-password").value;

      /* -----------------------------------------------------
           Validate login ID
           ----------------------------------------------------- */

      if (!loginId) {
        setError("f-login-id", true);

        valid = false;
      } else {
        setError("f-login-id", false);
      }

      /* -----------------------------------------------------
           Validate password
           ----------------------------------------------------- */

      if (!password) {
        setError("f-login-password", true);

        valid = false;
      } else {
        setError("f-login-password", false);
      }

      /* -----------------------------------------------------
           Stop if validation fails
           ----------------------------------------------------- */

      if (!valid) {
        showBanner(loginBanner, "error", "Please enter your login details.");

        return;
      }

      /* =====================================================
           SEND LOGIN REQUEST TO BACKEND
           ===================================================== */

      try {
        const res = await login({
          loginId,
          password,
        });

        /* ---------------------------------------------------
             Save session
             --------------------------------------------------- */

        setSession({
          ...res.session,
          token: res.token,
        });

        /* ---------------------------------------------------
             Show success message
             --------------------------------------------------- */

        showBanner(loginBanner, "success", `${res.message} Redirecting…`);

        /* ---------------------------------------------------
             Redirect according to role
             --------------------------------------------------- */

        setTimeout(() => {
          redirectByRole(res.session.role);
        }, 700);
      } catch (err) {
        showBanner(loginBanner, "error", err.message);
      }
    });
  }

  /* =========================================================
     SHOW / HIDE PASSWORD
     ========================================================= */

  document.querySelectorAll(".toggle-password").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", function () {
      const targetId = toggleBtn.dataset.target;

      const passwordInput = document.getElementById(targetId);

      if (!passwordInput) {
        return;
      }

      const show = passwordInput.type === "password";

      passwordInput.type = show ? "text" : "password";

      toggleBtn.classList.toggle("closed", !show);

      toggleBtn.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password",
      );
    });
  });

  /* =========================================================
     AUTO REDIRECT FOR LOGGED-IN USERS
     ========================================================= */

  document.addEventListener("DOMContentLoaded", function () {
    const session = getSession();

    if (
      session &&
      session.role === "patient" &&
      window.location.hash !== "#admin-login"
    ) {
      window.location.href = "patient-dashboard.html";

      return;
    }

    if (session && session.role === "admin") {
      window.location.href = "admin-dashboard.html";
    }
  });
})();
