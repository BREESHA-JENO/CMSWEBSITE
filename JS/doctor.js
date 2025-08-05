// ================= DOCTOR.JS =================

document.addEventListener("DOMContentLoaded", function () {
  const loggedIn = localStorage.getItem("loggedInUser");
  const sessionStart = localStorage.getItem("sessionStart");

  if (!loggedIn || !sessionStart) {
    alert("Unauthorized access. Please log in.");
    window.location.href = "/HTML/Admin/admin_login.html";
    return;
  }

  // Check for expired session first
  if (sessionStart) {
    const sessionAge = Date.now() - parseInt(sessionStart);
    if (sessionAge > MAX_SESSION_DURATION) {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("sessionStart");
      alert("Session expired. Please login again.");
      window.location.href = "/HTML/Admin/admin_login.html";
      return;
    }
  }

  // Check if the logged-in user is a Doctor
  const user = JSON.parse(loggedIn);
  if (user.role !== "Doctor") {
    alert("Unauthorized access. Please log in.");
    window.location.href = "/HTML/Admin/admin_login.html";
    return;
  }

  // Set welcome message with doctor's name
  const welcomeEl = document.getElementById('doctorWelcome');
  if (welcomeEl && user.name) {
    welcomeEl.textContent = `Welcome, Dr. ${user.name}`;
  }

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

  initDoctorDashboard();
});

function initDoctorDashboard() {
  // Initialize doctor dashboard functionality
  console.log("Doctor dashboard initialized");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const doctorId = user.staffId || user.username || user.email; // Try staffId, fallback to email

  // Load appointments from localStorage (entered by receptionist)
  const storedAppointments = localStorage.getItem('appointments');
  if (storedAppointments) {
    try {
      const appointments = JSON.parse(storedAppointments);
      // Filter appointments for this doctor
      const myAppointments = appointments.filter(a => a.doctorId === doctorId && a.status !== 'cancelled');
      // Fetch patient details for age
      const patients = JSON.parse(localStorage.getItem('patients')) || [];
      // Map appointments to include patient age
      const appointmentsWithAge = myAppointments.map(apt => {
        const patient = patients.find(p => p.id === apt.patientId);
        let age = '';
        if (patient && patient.dob) {
          const dob = new Date(patient.dob);
          const today = new Date();
          age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
        }
        return {
          ...apt,
          patientAge: age || (patient && patient.age) || '',
        };
      });
      displayDoctorPatients(appointmentsWithAge);
    } catch (error) {
      console.error("Error loading appointments from localStorage:", error);
    }
  } else {
    document.getElementById('table_body').innerHTML = '<tr><td colspan="5">No patients found for you.</td></tr>';
  }
}

function displayDoctorPatients(appointments) {
  const table_body = document.getElementById('table_body');
  let table_body_all = '';

  appointments.forEach((apt, idx) => {
    table_body_all += `<TR style="background-color: #f8f9fa;">
                         <TD style="padding: 12px; border: 1px solid #ddd;">${idx + 1}</TD>
                         <TD style="padding: 12px; border: 1px solid #ddd;">${apt.id || ''}</TD>
                         <TD style="padding: 12px; border: 1px solid #ddd;">${apt.patientId || ''}</TD>
                         <TD style="padding: 12px; border: 1px solid #ddd;">${apt.patientName || ''}</TD>
                         <TD style="padding: 12px; border: 1px solid #ddd;"><button class="open-consult-btn" data-patient-id="${apt.patientId}" data-patient-name="${apt.patientName}" data-patient-age="${apt.patientAge || ''}">Open Consultancy</button></TD>
                       </TR>`;
  });
  if (!appointments.length) {
    table_body_all = '<tr><td colspan="5">No patients found for you.</td></tr>';
  }
  table_body.innerHTML = table_body_all;
}

// --- Consultancy & History Logic ---
const consultancySection = document.getElementById('consultancySection');
const consultPatientName = document.getElementById('consultPatientName');
const consultPatientId = document.getElementById('consultPatientId');
const consultPatientAge = document.getElementById('consultPatientAge');
const historyBtn = document.getElementById('historyBtn');
const todayConsultBtn = document.getElementById('todayConsultBtn');
const historySection = document.getElementById('historySection');
const consultForm = document.getElementById('consultForm');
const prescriptionSelect = document.getElementById('prescriptionSelect');
const labTestSelect = document.getElementById('labTestSelect');
const labReportStatus = document.getElementById('labReportStatus');
const printBtn = document.getElementById('printBtn');

let currentPatientId = null;

// Load medicines from pharmacist module
function loadMedicinesForDropdown() {
  const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
  prescriptionSelect.innerHTML = '<option value="">Select Medicine</option>' + medicines.filter(m => m.quantity > 0).map(m => `<option value="${m.name}">${m.name}</option>`).join('');
}
// Load lab tests from availabletest
function loadLabTestsForDropdown() {
  // For demo, hardcode; in real, load from localStorage or backend
  const tests = [
    'Haemogram (CBC)', 'Blood Sugar Tests', 'Liver Function Test', 'Kidney Test',
    'Lungs Test', 'Heart Test', 'Infectious Diseases', 'Vitamin & Mineral', 'Thyroid Profile'
  ];
  labTestSelect.innerHTML = '<option value="">None</option>' + tests.map(t => `<option value="${t}">${t}</option>`).join('');
}

// Open Consultancy button handler
function handleOpenConsultancy(patientId, patientName, patientAge) {
  consultancySection.style.display = '';
  consultPatientName.textContent = patientName;
  consultPatientId.textContent = patientId;
  consultPatientAge.textContent = patientAge || 'N/A';
  historySection.style.display = 'none';
  consultForm.style.display = 'none';
  labReportStatus.textContent = '';
  currentPatientId = patientId;
}

document.getElementById('table_body').addEventListener('click', function(e) {
  if (e.target.classList.contains('open-consult-btn')) {
    const patientId = e.target.getAttribute('data-patient-id');
    const patientName = e.target.getAttribute('data-patient-name');
    const patientAge = e.target.getAttribute('data-patient-age');
    handleOpenConsultancy(patientId, patientName, patientAge);
  }
});

// History button
historyBtn.addEventListener('click', function() {
  if (!currentPatientId) return;
  const history = JSON.parse(localStorage.getItem('consultancyHistory_' + currentPatientId)) || [];
  // Fetch lab orders for this patient
  const labOrders = JSON.parse(localStorage.getItem('labOrders') || '[]');
  if (!history.length) {
    historySection.innerHTML = '<em>No previous consultancies.</em>';
  } else {
    historySection.innerHTML = '<h4>Consultancy History</h4>' + history.map((h, i) => {
      let labResult = '';
      let viewReportBtn = '';
      if (h.labTest) {
        // Find completed lab order for this patient, test, and date
        const order = labOrders.find(o => o.patientId === currentPatientId && o.testName === h.labTest && o.date === h.date && o.status === 'completed');
        if (order && order.result) {
          labResult = `<br><strong>Lab Result:</strong> ${order.result}`;
          // Find the report index in labReports for detailed view
          const labReports = JSON.parse(localStorage.getItem('labReports') || '[]');
          const reportIdx = labReports.findIndex(r => r.patientId === currentPatientId && r.testName === h.labTest && r.date === h.date && r.result === order.result);
          if (reportIdx !== -1) {
            viewReportBtn = `<button class='view-lab-report-btn' data-report-idx='${reportIdx}'>View Report</button>`;
          }
        }
      }
      return `
        <div style="margin-bottom: 1rem; padding-bottom: 0.7rem; border-bottom: 1px solid #eee;">
          <strong>Date:</strong> ${h.date}<br>
          <strong>Symptoms:</strong> ${h.symptoms}<br>
          <strong>Diagnosis:</strong> ${h.diagnosis}<br>
          <strong>Notes:</strong> ${h.notes}<br>
          <strong>Prescription:</strong> ${h.prescription}<br>
          <strong>Lab Test:</strong> ${h.labTest || 'None'}<br>
          <strong>Status:</strong> ${h.status || 'Completed'}<br>
          ${labResult}
          ${viewReportBtn}
          ${h.labTest && !labResult ? `<button onclick=\"alert('Lab report for ${h.labTest} (Status: Pending)')\">View Lab Report</button>` : ''}
        </div>
      `;
    }).join('');

    // Add event listeners for view report buttons
    setTimeout(() => {
      document.querySelectorAll('.view-lab-report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = this.getAttribute('data-report-idx');
          localStorage.setItem('selectedLabReportIdx', idx);
          window.location.href = '/HTML/Lab/viewreport.html';
        });
      });
    }, 0);
  }
  historySection.style.display = '';
  consultForm.style.display = 'none';
});

todayConsultBtn.addEventListener('click', function() {
  if (!currentPatientId) return;
  loadMedicinesForDropdown();
  loadLabTestsForDropdown();
  consultForm.reset();
  consultForm.style.display = '';
  historySection.style.display = 'none';
  labReportStatus.textContent = '';
  // Disable editing if already saved today
  const today = new Date().toISOString().split('T')[0];
  const history = JSON.parse(localStorage.getItem('consultancyHistory_' + currentPatientId)) || [];
  if (history.some(h => h.date === today)) {
    consultForm.querySelectorAll('input, textarea, select, button[type="submit"]').forEach(el => el.disabled = true);
    labReportStatus.textContent = 'Today\'s consultancy already saved.';
  } else {
    consultForm.querySelectorAll('input, textarea, select, button[type="submit"]').forEach(el => el.disabled = false);
  }
});

consultForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (!currentPatientId) return;
  const symptoms = document.getElementById('symptoms').value.trim();
  const diagnosis = document.getElementById('diagnosis').value.trim();
  const notes = document.getElementById('notes').value.trim();
  const prescription = prescriptionSelect.value;
  const labTest = labTestSelect.value;
  const today = new Date().toISOString().split('T')[0];
  const entry = {
    date: today,
    symptoms,
    diagnosis,
    notes,
    prescription,
    labTest,
    status: 'Completed',
    labStatus: labTest ? 'Pending' : ''
  };
  let history = JSON.parse(localStorage.getItem('consultancyHistory_' + currentPatientId)) || [];
  history.push(entry);
  localStorage.setItem('consultancyHistory_' + currentPatientId, JSON.stringify(history));
  consultForm.querySelectorAll('input, textarea, select, button[type="submit"]').forEach(el => el.disabled = true);
  labReportStatus.textContent = 'Consultancy saved. Entry is now read-only.';

  // --- Send lab order to lab module if lab test is selected ---
  if (labTest) {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const patient = patients.find(p => p.id === currentPatientId);
    const labOrder = {
      patientId: currentPatientId || '',
      patientName: (patient && patient.name) ? patient.name : '',
      doctorId: user.staffId || user.username || user.email || '',
      doctorName: user.name || user.fullName || 'N/A',
      testName: labTest || '',
      date: today || '',
      status: 'pending',
      result: '',
      symptoms: symptoms || '',
      diagnosis: diagnosis || '',
      notes: notes || ''
    };
    const labOrders = JSON.parse(localStorage.getItem('labOrders') || '[]');
    labOrders.push(labOrder);
    localStorage.setItem('labOrders', JSON.stringify(labOrders));
    // DEBUG LOGS
    console.log('[DEBUG] Lab order created:', labOrder);
    console.log('[DEBUG] Updated labOrders array:', labOrders);
  }
});

printBtn.addEventListener('click', function() {
  window.print();
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
    window.location.href = "/HTML/Admin/admin_login.html";
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


/*
let initial_user=[
    {
        "serialno":"1",
        "token_id":"a1",
        "patient_id":"p1",
        "patient_name":"Alan"
        
    },
    {
        "serialno":"2",
        "token_id":"a2",
        "patient_id":"p2",
        "patient_name":"Amal"
        
    },
    {"serialno":"3",
        "token_id":"a3",
        "patient_id":"p3",
        "patient_name":"Shalom"},
];
*/

// Define the correct relative path to your JSON file from the HTML file's location.
// Assuming your HTML is in a folder and your json is in a 'json' folder at the same level as a 'js' folder.
var json_address = "../json/doctor.json";

//to load from the json that i have created .
const load_from_json = async () => {
    try {
        const response = await fetch(json_address);
        
        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const patients = await response.json();
        
        // Get the table body to insert data into
        const table_body = document.getElementById('table_body');
        let table_body_all = '';

        // Loop through the patient data and build the table rows



        // Use the displayPatients function to show the data
        displayPatients(patients);

    } catch (error) {
        console.error("Error loading or parsing JSON:", error);
    }
};

let show_patient_button = document.getElementById("show_patient");

// When the button is clicked, call the load_from_json function.
// We wrap it in an anonymous function () => {} so we can call it without arguments.
show_patient_button.addEventListener('click', () => {
    load_from_json();
});

// Add event listener for the table body to handle button clicks
document.addEventListener('click', function(e) {
    if (e.target && e.target.textContent === 'Open') {
        const row = e.target.closest('tr');
        const patientName = row.cells[3].textContent;
        const patientId = row.cells[2].textContent;
        alert(`Opening patient record for ${patientName} (ID: ${patientId})`);
        // Add your patient record opening logic here
    }
});
//this is the code for putting my json into local storage
// The json_file_to_local function was not used, but here's a corrected version if you need it.
const json_file_to_local = async (json_address) => {
    try {
        const response = await fetch(json_address);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data_object = await response.json();
        const data_object_string = JSON.stringify(data_object);
        localStorage.setItem('patients', data_object_string);
    } catch (error) {
        console.error("Error fetching for localStorage:", error);
    }
};


// json_file_to_local();

// ==============================
// LOGOUT FUNCTION (prevents back navigation)
// ==============================
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
window.logout = logout;