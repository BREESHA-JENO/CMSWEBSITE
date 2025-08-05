// ================= PHARMACIST.JS =================

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

  // Check if the logged-in user is a Pharmacist
  const user = JSON.parse(loggedIn);
  if (user.role !== "Pharmacist") {
    alert("Access denied. Pharmacist privileges required.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }

  initPharmacistDashboard();

  // User icon dropdown toggle
  const userIconBtn = document.getElementById('userIconBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userIconBtn && userDropdown) {
    userIconBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      userDropdown.style.display = (userDropdown.style.display === 'none' || userDropdown.style.display === '') ? 'block' : 'none';
    });
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!userDropdown.contains(e.target) && e.target !== userIconBtn) {
        userDropdown.style.display = 'none';
      }
    });
  }
});

function initPharmacistDashboard() {
  // Initialize pharmacist dashboard functionality
  console.log("Pharmacist dashboard initialized");
}

const medicines = [
  { name: "Paracetamol 350mg", generic: "Paracetamol", quantity: 15, expiry: "2025-11-01" },
  { name: "Paracetamol 500mg", generic: "Paracetamol", quantity: 5, expiry: "2025-09-15" },
  { name: "Paracetamol 650mg", generic: "Paracetamol", quantity: 0, expiry: "2024-12-31" },
  { name: "Amoxylin 50mg", generic: "Amoxicillin", quantity: 22, expiry: "2026-03-20" }
];

const prescriptions = [
  { id: "P001", name: "Alice", prescription: "Paracetamol 500mg - 2/day" },
  { id: "P002", name: "Bob", prescription: "Amoxylin 50mg - 1/day" }
];

function showSection(sectionId) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");
}

function loadMedicineList() {
  const list = document.getElementById("medicineList");
  list.innerHTML = "";
  const medicines = JSON.parse(localStorage.getItem('medicines') || '[]');
  medicines.forEach((med, index) => {
    const item = document.createElement("li");
    item.textContent = `${med.name} (Qty: ${med.quantity})`;
    item.onclick = () => showMedicineDetails(index);
    list.appendChild(item);
  });
}

function showMedicineDetails(index) {
  const med = medicines[index];
  const stockStatus = med.quantity === 0
    ? "<span style='color:red;'>Out of Stock</span>"
    : med.quantity < 10
    ? "<span style='color:orange;'>Low Stock - Reorder Soon</span>"
    : "<span style='color:green;'>Available</span>";

  const details = `
    <h4>Medicine Details</h4>
    <p><strong>Name:</strong> ${med.name}</p>
    <p><strong>Generic Name:</strong> ${med.generic}</p>
    <p><strong>Quantity:</strong> ${med.quantity}</p>
    <p><strong>Expiry Date:</strong> ${med.expiry}</p>
    <p><strong>Status:</strong> ${stockStatus}</p>
  `;
  document.getElementById("medicineDetails").innerHTML = details;
}

function searchPrescription() {
  const query = document.getElementById("prescriptionSearch").value.toLowerCase();
  const result = prescriptions.find(p =>
    p.id.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)
  );
  const resultDiv = document.getElementById("prescriptionResults");

  if (query === "") {
    resultDiv.innerHTML = "";
    return;
  }

  if (result) {
    resultDiv.innerHTML = `
      <h4>Prescription for ${result.name} (${result.id})</h4>
      <p>${result.prescription}</p>
    `;
  } else {
    resultDiv.innerHTML = "<p>No matching prescription found.</p>";
  }
}

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "/HTML/Admin/admin_login.html";
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadMedicineList();
});

// Save medicines to localStorage for doctor module
localStorage.setItem('medicines', JSON.stringify(medicines));

// ==============================
// SESSION MANAGEMENT
// ==============================
const MAX_SESSION_DURATION = 60000; // 1 minute for testing

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

// Update session activity on user interaction
["click", "keydown", "mousemove", "scroll"].forEach(event => {
  document.addEventListener(event, updateSessionActivity);
});

// Check session timeout every minute
setInterval(checkSessionTimeout, 60000);

// Initial session check
checkSessionTimeout();

// ================== ADD NEW MEDICINE ==================
document.getElementById('addMedicineForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('medicineName').value.trim();
  const quantity = parseInt(document.getElementById('medicineQuantity').value, 10);

  if (!name || isNaN(quantity) || quantity < 1) {
    alert('Please enter valid medicine name and quantity.');
    return;
  }

  let medicines = JSON.parse(localStorage.getItem('medicines') || '[]');
  if (medicines.some(med => med.name.toLowerCase() === name.toLowerCase())) {
    alert('Medicine already exists. Please update stock instead.');
    return;
  }
  medicines.push({ name, quantity });
  localStorage.setItem('medicines', JSON.stringify(medicines));
  alert('Medicine added successfully!');
  this.reset();
  populateExistingMedicines(); // <-- Ensure inventory dropdown is updated
  loadMedicineList(); // <-- Refresh inventory display
});

// ================== UPDATE STOCK ==================
function populateExistingMedicines() {
  const select = document.getElementById('existingMedicineSelect');
  select.innerHTML = '';
  const medicines = JSON.parse(localStorage.getItem('medicines') || '[]');
  medicines.forEach(med => {
    const option = document.createElement('option');
    option.value = med.name;
    option.textContent = `${med.name} (Current: ${med.quantity})`;
    select.appendChild(option);
  });
}

document.getElementById('updateStockForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('existingMedicineSelect').value;
  const newQuantity = parseInt(document.getElementById('newMedicineQuantity').value, 10);

  if (!name || isNaN(newQuantity) || newQuantity < 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  let medicines = JSON.parse(localStorage.getItem('medicines') || '[]');
  const med = medicines.find(med => med.name === name);
  if (med) {
    med.quantity = newQuantity;
    localStorage.setItem('medicines', JSON.stringify(medicines));
    alert('Stock updated successfully!');
    this.reset();
    populateExistingMedicines();
    loadMedicineList(); // <-- Refresh inventory display
  } else {
    alert('Medicine not found.');
  }
});

document.addEventListener('DOMContentLoaded', populateExistingMedicines);