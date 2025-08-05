// ================= LOGIN.JS =================
const adminKey = "user_breesha@gmail.com";
let adminUser = JSON.parse(localStorage.getItem(adminKey));

if (!adminUser || !adminUser.role) {
  adminUser = {
    username: "breesha@gmail.com",
    password: "Breesha@123",
    role: "Admin"
  };
  localStorage.setItem(adminKey, JSON.stringify(adminUser));
}

let loginAttempts = 0;
let isLocked = false;

// Prevent dashboard access if not logged in
if (window.location.pathname.includes("dashboard") && !localStorage.getItem("loggedInUser")) {
  window.location.replace("/HTML/Admin/admin_login.html");
}

window.addEventListener("pageshow", function (event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    const loggedIn = localStorage.getItem("loggedInUser");
    if (!loggedIn) {
      window.location.replace("/HTML/Admin/admin_login.html");
    }
  }
});

document.getElementById("loginForm").addEventListener("submit", formvalidation);

function formvalidation(event) {
  event.preventDefault();

  if (isLocked) {
    alert("Too many failed attempts. Please wait 30 seconds.");
    return;
  }

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const success = document.getElementById('success');

  usernameError.innerHTML = "";
  passwordError.innerHTML = "";
  success.innerHTML = "";

  if (!username.endsWith("@gmail.com") && !username.endsWith("@yahoo.com")) {
    usernameError.innerHTML = "Only @gmail.com or @yahoo.com emails are allowed.";
    return;
  }

  if (!username) {
    usernameError.innerHTML = "Please enter your username";
    return;
  }

  if (!password) {
    passwordError.innerHTML = "Please enter your password";
    return;
  }

  const userData = localStorage.getItem("user_" + username);
  if (!userData) {
    usernameError.innerHTML = "User not found.";
    return;
  }

  const user = JSON.parse(userData);
  const staffInfo = JSON.parse(localStorage.getItem("staff_" + username));
  if (staffInfo && staffInfo.status === "inactive") {
    usernameError.innerHTML = "Your account is deactivated. Contact admin.";
    return;
  }

  if (user.password !== password) {
    passwordError.innerHTML = "Incorrect password.";
    loginAttempts++;

    if (loginAttempts >= 3) {
      isLocked = true;
      setTimeout(() => {
        isLocked = false;
        loginAttempts = 0;
        alert("You can try logging in again now.");
      }, 30000);
    }
    return;
  }

  loginAttempts = 0;

  // Ensure staffId is present for doctors
  if (user.role === "Doctor" && staffInfo && staffInfo.staffId) {
    user.staffId = staffInfo.staffId;
  }

  localStorage.setItem("loggedInUser", JSON.stringify(user));
  localStorage.setItem("sessionStart", Date.now().toString());

  success.innerHTML = "Login Successfully";

  setTimeout(() => {
    switch (user.role) {
      case "Admin":
        window.location.href = "/HTML/Admin/admin_dashboard.html";
        break;
      case "Doctor":
        window.location.href = "/HTML/Doctor/doctor_dashboard.html";
        break;
      case "Receptionist":
        window.location.href = "/HTML/Receptionist/receptionist_dashboard.html";
        break;
      case "Pharmacist":
        window.location.href = "/HTML/Pharmacist/pharmacist_dashboard.html";
        break;
      case "Lab Technician":
        window.location.href = "/HTML/Lab/labhome.html";
        break;
      default:
        alert("Unknown role. Contact system administrator.");
        break;
    }
  }, 1000);
}

function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("sessionStart");
  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    history.go(1);
  };
  alert("Logged out successfully.");
  window.location.replace("/HTML/Admin/admin_login.html");
}

const MAX_SESSION_DURATION = 1 * 60 * 1000; // 1 minute

function checkSessionTimeout() {
  const sessionStart = parseInt(localStorage.getItem("sessionStart"));
  if (!sessionStart || Date.now() - sessionStart > MAX_SESSION_DURATION) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("sessionStart");
    alert("Session expired. Please login again.");
    window.location.replace("/HTML/Admin/admin_login.html");
  }
}

function updateSessionActivity() {
  localStorage.setItem("sessionStart", Date.now().toString());
}

if (window.location.pathname.includes("dashboard")) {
  checkSessionTimeout();
  setInterval(checkSessionTimeout, 60000);
  ["click", "keydown", "mousemove", "scroll"].forEach(evt => {
    document.addEventListener(evt, updateSessionActivity);
  });
}