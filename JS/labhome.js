// ================= LABHOME.JS =================

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

  // Check if the logged-in user is a Lab Technician
  const user = JSON.parse(loggedIn);
  if (user.role !== "Lab Technician") {
    alert("Access denied. Lab Technician privileges required.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }

  initLabDashboard();
});

function initLabDashboard() {
  // Initialize lab dashboard functionality
  console.log("Lab dashboard initialized");
  renderLabOrders(); // <-- Ensure lab orders are displayed on load
}

function renderLabOrders() {
  console.log('--- renderLabOrders called ---');
  const section = document.getElementById('labOrdersSection');
  if (!section) {
    console.log('labOrdersSection not found in DOM');
    return;
  }
  let labOrdersRaw = localStorage.getItem('labOrders');
  if (!labOrdersRaw || labOrdersRaw === '[]') {
    // Add hardcoded test data for lab orders
    const testOrders = [
      {
        patientId: 'P0000001',
        patientName: 'John Doe',
        doctorId: 'D0001',
        doctorName: 'Dr. Smith',
        testName: 'Blood Test',
        date: '2025-07-15',
        status: 'pending',
        result: '',
        symptoms: 'Fever, cough',
        diagnosis: 'Viral infection',
        notes: 'Patient to rest and hydrate.'
      },
      {
        patientId: 'P0000002',
        patientName: 'Jane Roe',
        doctorId: 'D0002',
        doctorName: 'Dr. Adams',
        testName: 'Thyroid Profile',
        date: '2025-07-14',
        status: 'completed',
        result: 'Normal',
        symptoms: 'Fatigue',
        diagnosis: 'Thyroid check',
        notes: 'Monitor for 3 months.'
      }
    ];
    localStorage.setItem('labOrders', JSON.stringify(testOrders));
    labOrdersRaw = localStorage.getItem('labOrders');
    console.log('Hardcoded labOrders added for testing.');
  }
  console.log('labOrders raw from localStorage:', labOrdersRaw);
  const labOrders = JSON.parse(labOrdersRaw || '[]');
  console.log('labOrders parsed:', labOrders);
  // DEBUG LOGS
  console.log('[DEBUG] Loaded labOrders array:', labOrders);
  if (!labOrders.length) {
    section.innerHTML = '<p style="text-align:center;">No lab orders from doctors.</p>';
    console.log('[DEBUG] No lab orders found.');
    return;
  }
  let html = `<h3>Incoming Lab Orders</h3><table style="width:100%;border-collapse:collapse;">\
    <thead><tr>\
      <th style='border:1px solid #ccc;padding:8px;'>Patient ID</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Patient Name</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Doctor ID</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Doctor Name</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Test Name</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Date</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Symptoms</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Diagnosis</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Notes</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Status</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Result</th>\
      <th style='border:1px solid #ccc;padding:8px;'>Action</th>\
    </tr></thead><tbody>`;
  labOrders.forEach((order, idx) => {
    // DEBUG LOG
    console.log('[DEBUG] Rendering lab order:', order);
    html += `<tr>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.patientId}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.patientName}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.doctorId ? order.doctorId : ''}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.doctorName ? order.doctorName : 'N/A'}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.testName}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.date}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.symptoms ? order.symptoms : 'N/A'}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.diagnosis ? order.diagnosis : 'N/A'}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.notes ? order.notes : 'N/A'}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.status}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.result ? order.result : ''}</td>\
      <td style='border:1px solid #ccc;padding:8px;'>${order.status === 'pending' ? `<button data-idx='${idx}' class='open-report-btn'>Open</button>` : ''}</td>\
    </tr>`;
  });
  html += '</tbody></table>';
  section.innerHTML = html;

  // Add event listeners for open report
  section.querySelectorAll('.open-report-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      localStorage.setItem('selectedLabOrderIdx', idx);
      window.location.href = '/HTML/Lab/createreport.html';
    });
  });

  // Add event listeners for mark complete (if you want to keep this for completed orders)
  section.querySelectorAll('.mark-complete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const result = prompt('Enter lab result for this test:');
      if (result !== null && result.trim() !== '') {
        labOrders[idx].result = result.trim();
        labOrders[idx].status = 'completed';
        localStorage.setItem('labOrders', JSON.stringify(labOrders));
        // Add to labReports for viewreport page
        const labReports = JSON.parse(localStorage.getItem('labReports') || '[]');
        labReports.push(labOrders[idx]);
        localStorage.setItem('labReports', JSON.stringify(labReports));
        renderLabOrders();
      } else {
        alert('Result is required to complete the lab order.');
      }
    });
  });
}


document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const testListContainer = document.getElementById("testListContainer");
  const noResult = document.getElementById("noResult");

  const allTests = [
    "Haemogram (CBC)",
    "Blood Sugar Tests",
    "Liver Function Test",
    "Kidney Test",
    "Lungs Test",
    "Heart Test",
    "Infectious Diseases",
    "Vitamin & Mineral",
    "Thyroid Profile",
    "Blood Test",
    "Urine Test",
    "X-Ray",
    "ECG"
  ];

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();

    // Clear old results
    testListContainer.innerHTML = "";

    if (query === "") {
      testListContainer.classList.add("d-none");
      noResult.classList.add("d-none");
      return;
    }

    const filtered = allTests.filter(test =>
      test.toLowerCase().includes(query)
    );

    if (filtered.length > 0) {
      filtered.forEach(test => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = test;
        testListContainer.appendChild(li);
      });
      testListContainer.classList.remove("d-none");
      noResult.classList.add("d-none");
    } else {
      testListContainer.classList.add("d-none");
      noResult.classList.remove("d-none");
    }
  });
  renderLabOrders();
});

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
