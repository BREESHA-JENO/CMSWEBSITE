// ================= ADMIN.JS =================

document.addEventListener("DOMContentLoaded", function () {
  const loggedIn = localStorage.getItem("loggedInUser");
  const sessionStart = localStorage.getItem("sessionStart");

  // Check for expired session first
  if (sessionStart) {
    const sessionAge = Date.now() - parseInt(sessionStart);
    if (sessionAge > MAX_SESSION_DURATION) {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("sessionStart");
      alert("Session expired. Please login again.");
      window.location.replace("/HTML/Admin/admin_login.html");
      return;
    }
  }

  if (!loggedIn || !sessionStart) {
    alert("Please login first.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }

  // Check if the logged-in user is an Admin
  const user = JSON.parse(loggedIn);
  if (user.role !== "Admin") {
    alert("Access denied. Admin privileges required.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }

  const resetSection = document.getElementById("resetPassword");
  const resetLink = document.querySelector('a[onclick="showSection(\'resetPassword\')"]');

  if (!resetSection || !resetLink) {
    console.error("Element not found:", { resetSection, resetLink });
    return;
  }

  resetSection.classList.add("hidden");
  resetLink.classList.add("disabled");

  initAdminDashboard();
});



// document.getElementById("resetPassword").classList.add("hidden");
// document.querySelector('a[onclick="showSection(\'resetPassword\')"]').classList.add("disabled");

// // Disable reset password tab initially
// document.querySelector('a[onclick="showSection(\'resetPassword\')"]').classList.add("disabled");


let staffSaved = false;

function initAdminDashboard() {
  // Restore the resetPassword logic
  const pendingReset = localStorage.getItem("reset_pending_email");
  if (pendingReset) {
    document.querySelector('a[onclick="showSection(\'resetPassword\')"]').classList.remove("disabled");
    setTimeout(() => {
      showSection("resetPassword");
      const emailField = document.getElementById("resetUser");
      const passwordField = document.getElementById("newPassword");
      if (emailField) {
        emailField.value = pendingReset;
        emailField.readOnly = true;
      }
      if (passwordField) {
        passwordField.value = generatePassword();
      }
    }, 300);
  }

  // ✅ Fix: Search staff on Enter key
  const searchInput = document.getElementById("searchEmail");
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchStaff();
      }
    });
  }

  // ✅ Add real-time email validation
  const emailField = document.getElementById("emailField");
  if (emailField) {
    emailField.addEventListener("input", function() {
      const email = this.value.trim();
      const isValid = email.endsWith("@gmail.com") || email.endsWith("@yahoo.com");
      
      // Remove existing validation styling
      this.style.borderColor = "";
      this.style.backgroundColor = "";
      
      if (email && !isValid) {
        this.style.borderColor = "#dc3545";
        this.style.backgroundColor = "#fff5f5";
        this.setCustomValidity("Email must be from @gmail.com or @yahoo.com domain only.");
      } else {
        this.setCustomValidity("");
      }
    });
  }

  displayAllStaff(); // Optional to load initially
}



function showSection(sectionId) {
  if (sectionId === 'generateCredentials' && !staffSaved) {
    alert('Please save staff details first.');
    return;
  }

  document.querySelectorAll('main section').forEach(section => {
    section.classList.add('hidden');
  });

  // Always show section before any special logic
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
  }

  if (sectionId === 'viewAllStaff') {
    displayAllStaff();
  }

  if (sectionId === 'staffDetails' && staffSaved) {
    const form = document.getElementById('staffForm');
    form.reset();
    form.dataset.editing = "false";
    form.email.readOnly = false;
    toggleDoctorFields("");
    staffSaved = false;
  }

  if (sectionId === 'requestSection') {
    showRequests();
  }

  // ✅ FIXED: Check after section is shown
  if (sectionId === 'resetPassword') {
    const pendingEmail = localStorage.getItem("reset_pending_email");

  // ✅ Ensure email is available
    if (!pendingEmail) {
      alert("No approved request to reset password.");
    // Still hide the tab just in case
      document.getElementById("resetPassword").classList.add("hidden");
      return;
    }

  // ✅ Auto-fill fields here (instead of setTimeouts)
    const emailField = document.getElementById("resetUser");
    const passwordField = document.getElementById("newPassword");

    if (emailField) {
      emailField.value = pendingEmail;
    emailField.readOnly = true;
    }

    if (passwordField) {
      passwordField.value = generatePassword();
    }

  // Optionally scroll into view
    document.getElementById("resetPassword").scrollIntoView({ behavior: "smooth" });
  }

}


function toggleDoctorFields(role) {
  document.getElementById('doctorFields').style.display = role === 'Doctor' ? 'block' : 'none';
}

function getAge(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function generateStaffID(role) {
  const prefixMap = {
    "Doctor": "DOC",
    "Receptionist": "REC",
    "Pharmacist": "PHA",
    "Lab Technician": "LAB"
  };
  const prefix = prefixMap[role];
  let count = parseInt(localStorage.getItem(`${prefix}_count`) || '0') + 1;
  localStorage.setItem(`${prefix}_count`, count);
  return `${prefix}${count.toString().padStart(3, '0')}`;
}

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Credentials copied to clipboard!");
  }).catch(err => {
    console.error("Clipboard copy failed:", err);
  });
}

// --- WORKING DAYS BUTTONS HANDLING ---
function setupWorkingDaysButtons() {
  const container = document.getElementById('workingDaysButtons');
  if (!container) return;
  const hiddenInput = document.getElementById('workingDaysInput');
  container.addEventListener('click', function(e) {
    if (e.target.classList.contains('day-btn')) {
      e.target.classList.toggle('selected');
      // Update hidden input
      const selected = Array.from(container.querySelectorAll('.day-btn.selected')).map(btn => btn.dataset.day);
      hiddenInput.value = selected.join(', ');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setupWorkingDaysButtons();
});

// Add style for selected day buttons
(function() {
  const style = document.createElement('style');
  style.innerHTML = `.day-btn.selected { background: #003087; color: #fff; border: 1px solid #003087; } .day-btn { margin-right: 4px; margin-bottom: 4px; border-radius: 4px; border: 1px solid #ccc; background: #f5f5f5; color: #333; padding: 6px 12px; cursor: pointer; }`;
  document.head.appendChild(style);
})();

// --- Specialization Dropdown Handling ---
function handleSpecializationChange(select) {
  const otherInput = document.getElementById('specializationOther');
  if (select.value === 'Other') {
    otherInput.style.display = '';
    otherInput.required = true;
  } else {
    otherInput.style.display = 'none';
    otherInput.required = false;
    otherInput.value = '';
  }
}

// Update form submission to use correct specialization value
const staffForm = document.getElementById('staffForm');
staffForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  const email = formData.get("email");

// ✅ Email format check - only @gmail.com and @yahoo.com allowed
if (!email.endsWith("@gmail.com") && !email.endsWith("@yahoo.com")) {
  alert("Email must be from @gmail.com or @yahoo.com domain only.");
  return;
}

// ✅ Duplicate email check (only if not editing)
const editing = this.dataset.editing === "true";
if (!editing && localStorage.getItem("staff_" + email)) {
  alert("Email already exists for another staff.");
  return;
}

  const phone = formData.get("tel");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    alert("Phone number must be 10 digits and start with 9, 8, 7, or 6.");
    return;
  }

  for (let key in localStorage) {
    if (key.startsWith("staff_")) {
      const staff = JSON.parse(localStorage.getItem(key));
      if (staff.tel === phone && this.dataset.editing !== "true") {
        alert("Phone number already exists for another staff.");
        return;
      }
    }
  }

  const dob = new Date(formData.get("dob"));
  const role = formData.get("role");
  // --- Specialization value handling ---
  let specialization = '';
  if (role === 'Doctor') {
    const specDropdown = document.getElementById('specializationDropdown');
    const specOther = document.getElementById('specializationOther');
    specialization = specDropdown.value === 'Other' ? specOther.value.trim() : specDropdown.value;
    if (!specialization) {
      alert('Please select or enter a specialization.');
      return;
    }
    formData.set('specialization', specialization);
  }
  const age = getAge(dob);

  if (age > 80) {
    alert("Staff age cannot exceed 80 years.");
    return;
  }

  if ((["Receptionist", "Lab Technician", "Pharmacist"].includes(role) && age < 18) ||
      (role === "Doctor" && age < 25)) {
    alert(`${role}s must be at least ${role === "Doctor" ? 25 : 18} years old.`);
    return;
  }

  // --- WORKING DAYS BUTTONS HANDLING ---
  let workingDays = "";
  if (role === "Doctor") {
    const container = document.getElementById('workingDaysButtons');
    const selected = Array.from(container.querySelectorAll('.day-btn.selected')).map(btn => btn.dataset.day);
    if (selected.length < 3) {
      alert("Doctors must have at least 3 working days.");
      return;
    }
    workingDays = selected.join(", ");
    formData.set("workingDays", workingDays);
    document.getElementById('workingDaysInput').value = workingDays;
    const charges = parseInt(formData.get("charges"));
    if (charges < 100) {
      alert("Consultation fee must be at least 100.");
      return;
    }
  }

  const bloodGroup = formData.get("bloodGroup");
  const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  if (!validBloodGroups.includes(bloodGroup)) {
    alert("Invalid blood group.");
    return;
  }

  const staff = Object.fromEntries(formData);

  if (!editing) {
    const staffId = generateStaffID(staff.role);
    staff.staffId = staffId;
    staff.status = "active";
  } else {
    const existing = JSON.parse(localStorage.getItem("staff_" + email));
    staff.staffId = existing.staffId;
    staff.status = existing.status;
  }

  localStorage.setItem('staff_' + email, JSON.stringify(staff));
  staffSaved = true;
  document.getElementById('generateCredentialsLink').classList.remove('disabled');

  document.querySelector('#credentialsForm [name=username]').value = email;
  document.querySelector('#credentialsForm [name=password]').value = "";
  document.getElementById('credentialStatus').textContent = "";

  alert('Staff saved with ID: ' + staff.staffId);
  showSection('generateCredentials');
});

function generateAndSaveCredentials() {
  const email = document.querySelector('#credentialsForm [name=username]').value;
  const staff = JSON.parse(localStorage.getItem('staff_' + email));
  if (!staff) {
    document.getElementById('credentialStatus').textContent = 'Email not found in staff records';
    return;
  }

  const lastGenerated = localStorage.getItem('cred_time_' + email);
  const now = Date.now();
  if (lastGenerated && now - parseInt(lastGenerated) < 60000) {
    alert("Please wait 1 minute before regenerating credentials for this email.");
    return;
  }

  const password = generatePassword();
  document.querySelector('#credentialsForm [name=password]').value = password;

  const credentials = { username: email, password: password, role: staff.role };
  localStorage.setItem('user_' + email, JSON.stringify(credentials));
  localStorage.setItem('cred_time_' + email, now.toString());
  document.getElementById('credentialStatus').textContent = 'User created successfully!';

  copyToClipboard(`Username: ${email}\nPassword: ${password}`);
}

document.getElementById('resetForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = this.resetUser.value;
  const newPassword = this.newPassword.value;
  const user = JSON.parse(localStorage.getItem('user_' + email));
  if (!user) {
    document.getElementById('resetStatus').textContent = 'User not found';
    return;
  }

  // Update password
  user.password = newPassword;
  localStorage.setItem('user_' + email, JSON.stringify(user));
  document.getElementById('resetStatus').textContent = 'Password updated successfully';

  // ✅ Optional Cleanup:
  // 1. Clear temporary email used to unlock reset tab
  localStorage.removeItem("reset_pending_email");

  // 2. Disable the Reset Password tab again
  document.querySelector('a[onclick="showSection(\'resetPassword\')"]').classList.add("disabled");

  // 3. Clear the form fields after resetting
  this.resetUser.value = "";
  this.newPassword.value = "";
});


function displayAllStaff() {
  const staffDisplay = document.getElementById('staffDisplayArea');
  staffDisplay.innerHTML = "";

  let grouped = {
    "Doctor": [],
    "Receptionist": [],
    "Pharmacist": [],
    "Lab Technician": []
  };

  for (let key in localStorage) {
    if (key.startsWith("staff_")) {
      const staff = JSON.parse(localStorage.getItem(key));
      // Validate email domain for existing staff
      if (!staff.email.endsWith("@gmail.com") && !staff.email.endsWith("@yahoo.com")) {
        console.warn(`Staff ${staff.name} has invalid email domain: ${staff.email}`);
      }
      grouped[staff.role]?.push(staff);
    }
  }

  for (let role in grouped) {
    if (grouped[role].length > 0) {
      staffDisplay.innerHTML += `<h4>${role}s</h4>`;
      let table = `<table><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th>`;
      if (role === 'Doctor') {
        table += `<th>Specialization</th>`;
      }
      table += `<th>Actions</th></tr>`;
      grouped[role].forEach(staff => {
        const isValidEmail = staff.email.endsWith("@gmail.com") || staff.email.endsWith("@yahoo.com");
        const emailStyle = isValidEmail ? "" : "color: red; font-weight: bold;";
        const emailText = isValidEmail ? staff.email : `${staff.email} (Invalid Domain)`;
        const specText = staff.specialization || '';
        table += `<tr>
          <td>${staff.staffId}</td>
          <td>${staff.name}</td>
          <td style="${emailStyle}">${emailText}</td>
          <td>${staff.tel}</td>
          <td>${staff.status}</td>`;
        if (role === 'Doctor') {
          table += `<td>${specText}</td>`;
        }
        table += `<td>
            <button data-action="edit" data-email="${staff.email}">Edit</button>
            <button data-action="${staff.status === "active" ? "deactivate" : "activate"}" data-email="${staff.email}">${staff.status === "active" ? "Deactivate" : "Activate"}</button>
          </td>
        </tr>`;
      });
      table += "</table>";
      staffDisplay.innerHTML += table;
    }
  }
}

// --- Pre-select working days on edit ---
function editStaff(email) {
  const staff = JSON.parse(localStorage.getItem("staff_" + email));
  const form = document.getElementById("staffForm");
  form.dataset.editing = "true";

  form.name.value = staff.name;
  form.email.value = staff.email;
  form.email.readOnly = true;
  form.dob.value = staff.dob;
  form.gender.value = staff.gender;
  form.tel.value = staff.tel;
  form.address.value = staff.address;
  form.role.value = staff.role;
  form.bloodGroup.value = staff.bloodGroup || "";
  toggleDoctorFields(staff.role);

  // --- Pre-select specialization on edit ---
  if (staff.role === 'Doctor') {
    const specDropdown = document.getElementById('specializationDropdown');
    const specOther = document.getElementById('specializationOther');
    if (specDropdown && specOther) {
      const options = Array.from(specDropdown.options).map(opt => opt.value);
      if (options.includes(staff.specialization)) {
        specDropdown.value = staff.specialization;
        specOther.style.display = 'none';
        specOther.value = '';
      } else {
        specDropdown.value = 'Other';
        specOther.style.display = '';
        specOther.value = staff.specialization;
      }
    }
  }
  form.specialization.value = staff.specialization || '';
  form.charges.value = staff.charges || '';
  // Pre-select working days (buttons)
  const container = document.getElementById('workingDaysButtons');
  if (container && staff.workingDays) {
    const days = staff.workingDays.split(/, ?/);
    Array.from(container.querySelectorAll('.day-btn')).forEach(btn => {
      btn.classList.toggle('selected', days.includes(btn.dataset.day));
    });
    document.getElementById('workingDaysInput').value = staff.workingDays;
  }
  form.workingTime.value = staff.workingTime || '';

  showSection("staffDetails");
}

function deactivateStaff(email) {
  const staff = JSON.parse(localStorage.getItem("staff_" + email));
  if (staff) {
    staff.status = "inactive";
    localStorage.setItem("staff_" + email, JSON.stringify(staff));
    alert("Staff deactivated.");
    displayAllStaff();
  }
}

function activateStaff(email) {
  const staff = JSON.parse(localStorage.getItem("staff_" + email));
  if (staff) {
    staff.status = "active";
    localStorage.setItem("staff_" + email, JSON.stringify(staff));
    alert("Staff activated.");
    displayAllStaff();
  }
}

document.getElementById("staffDisplayArea").addEventListener("click", function (e) {
  const action = e.target.dataset.action;
  if (action === "edit") {
    editStaff(e.target.dataset.email);
  } else if (action === "deactivate") {
    deactivateStaff(e.target.dataset.email);
  } else if (action === "activate") {
    activateStaff(e.target.dataset.email);
  } else if (action === "back") {
    displayAllStaff();
  }
});

function searchStaff() {
  const keyword = document.getElementById("searchEmail").value.trim();
  const staffDisplay = document.getElementById('staffDisplayArea');
  staffDisplay.innerHTML = "";

  if (!keyword) {
    displayAllStaff();
    return;
  }

  for (let key in localStorage) {
    if (key.startsWith("staff_")) {
      const staff = JSON.parse(localStorage.getItem(key));
      if (
        staff.email.toLowerCase() === keyword.toLowerCase() ||
        staff.staffId.toLowerCase() === keyword.toLowerCase()
      ) {
        let table = `<table>
          <tr><th>ID</th><td>${staff.staffId}</td></tr>
          <tr><th>Name</th><td>${staff.name}</td></tr>
          <tr><th>Email</th><td>${staff.email}</td></tr>
          <tr><th>Role</th><td>${staff.role}</td></tr>
          <tr><th>Phone</th><td>${staff.tel}</td></tr>
          <tr><th>Address</th><td>${staff.address}</td></tr>
          <tr><th>DOB</th><td>${staff.dob}</td></tr>
          <tr><th>Gender</th><td>${staff.gender}</td></tr>
          <tr><th>Blood Group</th><td>${staff.bloodGroup || ''}</td></tr>
          <tr><th>Status</th><td>${staff.status}</td></tr>`;

        if (staff.role === "Doctor") {
          table += `<tr><th>Specialization</th><td>${staff.specialization}</td></tr>
            <tr><th>Consultation Fee</th><td>${staff.charges}</td></tr>
            <tr><th>Working Days</th><td>${staff.workingDays}</td></tr>
            <tr><th>Working Time</th><td>${staff.workingTime}</td></tr>`;
        }

        table += `</table><br><button data-action="back">Back to Staff List</button>`;
        staffDisplay.innerHTML = table;
        return;
      }
    }
  }

  staffDisplay.innerHTML = "<p>No staff found with that email or ID.</p>";
}

//document.getElementById("searchButton").addEventListener("click", searchStaff);
// document.getElementById("searchForm").addEventListener("submit", function (e) {
//   e.preventDefault(); // Prevents page reload
//   searchStaff(); // Your existing function
// });

// document.getElementById("staffDisplayArea").addEventListener("click", function (e) {
//     if (e.target.dataset.action === "back") {
//       displayAllStaff();
//     }
//   });

function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("sessionStart");

  // Prevent back navigation to dashboard
  history.pushState(null, null, location.href);
  window.addEventListener("popstate", function () {
    history.pushState(null, null, location.href);
  });

  alert("You have been logged out.");
  window.location.href = "/HTML/Admin/admin_login.html";
}



const MAX_SESSION_DURATION = 60000;
function updateSessionActivity() {
  localStorage.setItem("sessionStart", Date.now().toString());
}
function checkSessionTimeout() {
  const sessionStart = parseInt(localStorage.getItem("sessionStart"));
  if (!sessionStart || Date.now() - sessionStart > MAX_SESSION_DURATION) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("sessionStart");
    alert("Session expired. Please login again.");
    // Force redirect without setTimeout to avoid loops
    window.location.replace("/HTML/Admin/admin_login.html");
  }
}
["click", "keydown", "mousemove", "scroll"].forEach(event => {
  document.addEventListener(event, updateSessionActivity);
});
setInterval(checkSessionTimeout, 60000);
checkSessionTimeout();

// function showRequests() {
//   const container = document.getElementById("pendingRequestsContainer");
//   container.innerHTML = "";

//   let found = false;

//   for (let key in localStorage) {
//     if (key.startsWith("request_")) {
//       found = true;
//       const req = JSON.parse(localStorage.getItem(key));
//       const staff = JSON.parse(localStorage.getItem("staff_" + req.email)) || {};
//       let html = `<div class="request-card">
//         <strong>${req.type} Request</strong><br>
//         <strong>From:</strong> ${staff.name || req.email}<br>
//         <strong>Email:</strong> ${req.email}<br>
//         <strong>Date:</strong> ${req.date}<br>
//         ${req.type === "Leave" ? `<strong>Reason:</strong> ${req.reason}<br>` : ""}
//         <button onclick="processRequest('${key}', true)">Approve</button>
//         <button onclick="processRequest('${key}', false)">Deny</button>
//       </div><br>`;
//       container.innerHTML += html;
//     }
//   }

//   if (!found) {
//     container.innerHTML = "<p>No pending requests.</p>";
//   }
// }

function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(x => chars[x % chars.length])
    .join('');
}



function processRequest(requestKey, approve) {
  const req = JSON.parse(localStorage.getItem(requestKey));
  if (!req) {
    console.error("[processRequest] Request not found for key:", requestKey);
    return;
  }

  console.log(`[processRequest] Processing request:`, req, "Approve:", approve);

  if (approve && (req.type === "Forgot Password" || req.type === "ForgotPassword")) {
    console.log("[processRequest] Approving forgot password for:", req.email);
    console.log("[processRequest] About to call resetForgotPassword...");
    resetForgotPassword(req.email);
    console.log("[processRequest] resetForgotPassword called, setting up redirect...");

    // Delay redirection to reset section after approving
    setTimeout(() => {
      console.log("[processRequest] Redirecting to resetPassword section");
      showSection("resetPassword");
    }, 200);
  }

  alert(`${req.type} request ${approve ? "approved" : "denied"} for ${req.email}`);
  localStorage.removeItem(requestKey);

  // ✅ Refresh requests only if not navigating away
  if (!(approve && req.type === "Forgot Password")) {
    showRequests();
  }
}

function resetForgotPassword(email) {
  console.log("[resetForgotPassword] 🚀 FUNCTION CALLED for email:", email);

  // Store email first
  localStorage.setItem("reset_pending_email", email);
  console.log("[resetForgotPassword] Email stored in localStorage:", email);

  // Enable Reset tab - try multiple selectors
  let resetTab = document.querySelector('a[onclick="showSection(\'resetPassword\')"]');
  if (!resetTab) {
    // Try alternative selector
    resetTab = document.querySelector('aside nav a[onclick*="resetPassword"]');
  }
  if (!resetTab) {
    // Try finding by text content
    const allLinks = document.querySelectorAll('aside nav a');
    for (let link of allLinks) {
      if (link.textContent.trim() === 'Reset Password') {
        resetTab = link;
        break;
      }
    }
  }
  
  if (!resetTab) {
    console.error("[resetForgotPassword] ❌ Reset Password tab link not found.");
    console.log("[resetForgotPassword] Available links:", document.querySelectorAll('aside nav a'));
    return;
  }
  resetTab.classList.remove("disabled");
  console.log("[resetForgotPassword] Reset tab enabled");

  // Delay to ensure localStorage is set before navigation
  setTimeout(() => {
    console.log("[resetForgotPassword] Showing reset section...");
    showSection("resetPassword");

    // Fill form after tab is shown
    setTimeout(() => {
      const emailField = document.getElementById("resetUser");
      const passwordField = document.getElementById("newPassword");

      if (!emailField) {
        console.error("[resetForgotPassword] Email field not found");
      } else {
        emailField.value = email;
        emailField.readOnly = true;
        console.log("[resetForgotPassword] Email field set and readonly");
      }

      if (!passwordField) {
        console.error("[resetForgotPassword] Password field not found");
      } else {
        passwordField.value = generatePassword();
        console.log("[resetForgotPassword] Password field set");
      }
    }, 300); // Increased delay for DOM readiness
  }, 300); // Increased delay for localStorage update
}


function autoGeneratePassword() {
  document.getElementById("newPassword").value = generatePassword();
}

// Debug function to test the flow manually
function testResetPasswordFlow() {
  console.log("[DEBUG] Testing reset password flow...");
  
  // Test 1: Check if we can find the reset password link
  const resetTab = document.querySelector('a[onclick="showSection(\'resetPassword\')"]');
  console.log("[DEBUG] Reset tab found:", resetTab);
  
  // Test 2: Check if we can find the reset password section
  const resetSection = document.getElementById("resetPassword");
  console.log("[DEBUG] Reset section found:", resetSection);
  
  // Test 3: Check if we can find the form fields
  const emailField = document.getElementById("resetUser");
  const passwordField = document.getElementById("newPassword");
  console.log("[DEBUG] Email field found:", emailField);
  console.log("[DEBUG] Password field found:", passwordField);
  
  // Test 4: Try to enable the tab
  if (resetTab) {
    resetTab.classList.remove("disabled");
    console.log("[DEBUG] Reset tab enabled");
  }
  
  // Test 5: Try to show the section
  if (resetSection) {
    showSection("resetPassword");
    console.log("[DEBUG] Reset section shown");
  }
  
  // Test 6: Try to fill the form
  if (emailField && passwordField) {
    emailField.value = "test@example.com";
    emailField.readOnly = true;
    passwordField.value = generatePassword();
    console.log("[DEBUG] Form filled with test data");
  }
}

function showRequests() {
  const container = document.getElementById("pendingRequestsContainer");
  container.innerHTML = "";

  console.log("📩 Checking localStorage for requests...");

  let found = false;

  for (let key in localStorage) {
    if (key.startsWith("request_")) {
      try {
        console.log("📌 Found request:", key);
        const req = JSON.parse(localStorage.getItem(key));
        const staff = JSON.parse(localStorage.getItem("staff_" + req.email)) || {};
      
        let html = `<div class="request-card">
          <strong>${req.type} Request</strong><br>
          <strong>From:</strong> ${staff.name || req.email}<br>
          <strong>Email:</strong> ${req.email}<br>
          <strong>Date:</strong> ${req.date}<br>
          ${req.type === "Leave" ? `<strong>Reason:</strong> ${req.reason}<br>` : ""}
          <button onclick="processRequest('${key}', true)">Approve</button>
          <button onclick="processRequest('${key}', false)">Deny</button>
        </div><br>`;

        container.innerHTML += html;
        found = true;

      } catch (err) {
        console.error("❌ Error rendering request:", key, err);
      }
    }  
  }

  if (!found) {
    container.innerHTML = "<p>No pending requests.</p>";
  }
}