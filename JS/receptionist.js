// ================= RECEPTIONIST.JS =================

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

  // Check if the logged-in user is a Receptionist
  const user = JSON.parse(loggedIn);
  if (user.role !== "Receptionist") {
    alert("Access denied. Receptionist privileges required.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }

  initReceptionistDashboard();
});

function initReceptionistDashboard() {
  // Initialize any dashboard-specific functionality here
  // For now, just ensure the dashboard is ready
  console.log("Receptionist dashboard initialized");
}

function showSection(sectionId) {
  document.querySelectorAll('main section').forEach(section => {
    section.classList.add('hidden');
  });
  document.getElementById(sectionId).classList.remove('hidden');

  if (sectionId === 'updatePatient') {
    // Initialize update patient section
    document.getElementById("updateSearchResults").innerHTML = "";
    document.getElementById("updatePatientFormSection").style.display = "none";
    // Show all patients by default
    displayAllPatientsForUpdate();
    // Set min and max registration date to today and today+21 days
    const regDateInput = document.getElementById('updatePatientRegDate');
    if (regDateInput) {
      const today = new Date();
      const minDate = today.toISOString().split('T')[0];
      const maxDateObj = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
      const maxDate = maxDateObj.toISOString().split('T')[0];
      regDateInput.min = minDate;
      regDateInput.max = maxDate;
    }
  }

  if (sectionId === 'addPatient') {
    // Set min and max registration date to today and today+21 days
    const regDateInput = document.querySelector('input[name="registrationDate"]');
    if (regDateInput) {
      const today = new Date();
      const minDate = today.toISOString().split('T')[0];
      const maxDateObj = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
      const maxDate = maxDateObj.toISOString().split('T')[0];
      regDateInput.min = minDate;
      regDateInput.max = maxDate;
    }
  }

  if (sectionId === 'appointments') {
    loadDoctors();
    loadAppointments();
    initializeAppointmentForm();
  }

  if (sectionId === 'tokens') {
    loadDoctorsForTokens();
  }

  if (sectionId === 'viewAllPatients') {
    displayAllPatients();
  }
}

// ==============================
// ADD PATIENT
// ==============================
document.getElementById('patientForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const patient = Object.fromEntries(formData);
  patient.id = generatePatientID();
  patient.status = "active";
  let patients = JSON.parse(localStorage.getItem("patients")) || [];
  patients.push(patient);
  localStorage.setItem("patients", JSON.stringify(patients));
  alert("Patient added successfully with ID: " + patient.id);
  document.getElementById('appointmentPatientId').value = patient.id;
  document.getElementById('appointmentPatientName').value = patient.name;
  this.reset();
  showSection('appointments');
});

// Generate 8-character patient ID starting with 'P'
function generatePatientID() {
  let count = parseInt(localStorage.getItem('P_count') || '0') + 1;
  localStorage.setItem('P_count', count);
  return 'P' + count.toString().padStart(7, '0');
}

// Validate name (alphabets only, max 30 characters)
function validateName(name) {
  if (!name || name.trim() === '') {
    alert('Name is required.');
    return false;
  }
  
  if (name.length > 30) {
    alert('Name cannot exceed 30 characters.');
    return false;
  }
  
  // Check if name contains only alphabets and spaces
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(name)) {
    alert('Name can only contain alphabets and spaces. Numbers and special characters are not allowed.');
    return false;
  }
  
  return true;
}

// Validate contact (numbers only, exactly 10 digits)
function validateContact(contact) {
  if (!contact || contact.trim() === '') {
    alert('Contact number is required.');
    return false;
  }
  
  if (contact.length !== 10) {
    alert('Contact number must be exactly 10 digits.');
    return false;
  }
  
  // Check if contact contains only numbers
  const contactRegex = /^[0-9]{10}$/;
  if (!contactRegex.test(contact)) {
    alert('Contact number can only contain digits (0-9). No letters or special characters allowed.');
    return false;
  }
  
  return true;
}



// ==============================
// UPDATE PATIENT
// ==============================
function searchPatientForUpdate() {
  const patientId = document.getElementById("updateSearchPatientId").value.trim();
  const patientName = document.getElementById("updateSearchPatientName").value.trim().toLowerCase();
  const patientEmail = document.getElementById("updateSearchPatientEmail").value.trim().toLowerCase();
  
  const resultsDiv = document.getElementById("updateSearchResults");
  resultsDiv.innerHTML = "";

  // If no search criteria provided, show all patients
  if (!patientId && !patientName && !patientEmail) {
    displayAllPatientsForUpdate();
    return;
  }

  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  let results = patients;

  // Apply filters
  if (patientId) {
    results = results.filter(p => p.id.toLowerCase().includes(patientId.toLowerCase()));
  }
  if (patientName) {
    results = results.filter(p => p.name.toLowerCase().includes(patientName));
  }
  if (patientEmail) {
    results = results.filter(p => p.email && p.email.toLowerCase().includes(patientEmail));
  }

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No patients found matching your search criteria.</p>";
    return;
  }

  results.forEach(patient => {
    const div = document.createElement("div");
    div.className = "patient-result-item";
    div.onclick = () => loadPatientForUpdate(patient.id);
    div.innerHTML = `
      <h5>${patient.name} (ID: ${patient.id})</h5>
      <p><strong>Age:</strong> ${patient.age} | <strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
      <p><strong>Email:</strong> ${patient.email || 'N/A'} | <strong>Contact:</strong> ${patient.contact}</p>
      <p><strong>Status:</strong> <span style="color: ${patient.status === 'active' ? 'green' : 'red'}">${patient.status}</span></p>
      <p><strong>Registration Date:</strong> ${patient.registrationDate || 'N/A'}</p>
      <small>Click to edit this patient</small>
    `;
    resultsDiv.appendChild(div);
  });
}

function displayAllPatientsForUpdate() {
  const resultsDiv = document.getElementById("updateSearchResults");
  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  
  if (patients.length === 0) {
    resultsDiv.innerHTML = "<p>No patients found in the system.</p>";
    return;
  }

  resultsDiv.innerHTML = "<h4>All Patients (Click to Edit)</h4>";
  
  patients.forEach(patient => {
    const div = document.createElement("div");
    div.className = "patient-result-item";
    div.onclick = () => loadPatientForUpdate(patient.id);
    div.innerHTML = `
      <h5>${patient.name} (ID: ${patient.id})</h5>
      <p><strong>Age:</strong> ${patient.age} | <strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
      <p><strong>Email:</strong> ${patient.email || 'N/A'} | <strong>Contact:</strong> ${patient.contact}</p>
      <p><strong>Status:</strong> <span style="color: ${patient.status === 'active' ? 'green' : 'red'}">${patient.status}</span></p>
      <p><strong>Registration Date:</strong> ${patient.registrationDate || 'N/A'}</p>
      <small>Click to edit this patient</small>
    `;
    resultsDiv.appendChild(div);
  });
}

function loadPatientForUpdate(patientId) {
  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  const patient = patients.find(p => p.id === patientId);

  if (!patient) {
    alert("Patient not found.");
    return;
  }

  // Populate the update form
  document.getElementById("updatePatientId").value = patient.id;
  document.getElementById("updatePatientName").value = patient.name;
  document.getElementById("updatePatientAge").value = patient.age;
  document.getElementById("updatePatientEmail").value = patient.email || '';
  document.getElementById("updatePatientContact").value = patient.contact;
  document.getElementById("updatePatientAddress").value = patient.address || '';
  document.getElementById("updatePatientRegDate").value = patient.registrationDate || '';
  document.getElementById("updatePatientHistory").value = patient.history || '';

  // Set gender radio button
  document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.checked = radio.value === patient.gender;
  });

  // Set status radio button
  document.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.checked = radio.value === patient.status;
  });

  // Show the update form section
  document.getElementById("updatePatientFormSection").style.display = "block";
  
  // Scroll to the form
  document.getElementById("updatePatientFormSection").scrollIntoView({ behavior: 'smooth' });
}

function clearUpdateSearch() {
  document.getElementById("updateSearchPatientId").value = "";
  document.getElementById("updateSearchPatientName").value = "";
  document.getElementById("updateSearchPatientEmail").value = "";
  document.getElementById("updateSearchResults").innerHTML = "";
  document.getElementById("updatePatientFormSection").style.display = "none";
}

function cancelUpdate() {
  document.getElementById("updatePatientFormSection").style.display = "none";
  document.getElementById("updatePatientForm").reset();
}

// Handle update patient form submission
document.getElementById('updatePatientForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const updatedPatient = Object.fromEntries(formData);
  
  // Validate name (alphabets only, max 30 characters)
  if (!validateName(updatedPatient.name)) {
    return;
  }
  
  // Validate contact (numbers only, max 10 digits)
  if (!validateContact(updatedPatient.contact)) {
    return;
  }
  
  // Validate age
  const age = parseInt(updatedPatient.age);
  if (isNaN(age) || age <= 0 || age > 130) {
    alert('Age must be a valid number between 1 and 130 years.');
    return;
  }
  
  // Validate registration date (must be today or future)
  if (updatedPatient.registrationDate) {
    const regDate = new Date(updatedPatient.registrationDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    regDate.setHours(0,0,0,0);
    if (regDate < today) {
      alert('Registration date cannot be in the past.');
      return;
    }
  }
  
  // Validate registration date (must be today or within 3 weeks)
  if (updatedPatient.registrationDate) {
    const regDate = new Date(updatedPatient.registrationDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    regDate.setHours(0,0,0,0);
    const maxDate = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
    maxDate.setHours(0,0,0,0);
    if (regDate < today) {
      alert('Registration date cannot be in the past.');
      return;
    }
    if (regDate > maxDate) {
      alert('Registration date cannot be more than 3 weeks from today.');
      return;
    }
  }
  
  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  const patientIndex = patients.findIndex(p => p.id === updatedPatient.id);
  
  if (patientIndex === -1) {
    alert("Patient not found.");
    return;
  }

  // Update the patient
  patients[patientIndex] = { ...patients[patientIndex], ...updatedPatient };
  localStorage.setItem("patients", JSON.stringify(patients));

  alert("Patient updated successfully!");
  
  // Reset form and hide update section
  this.reset();
  document.getElementById("updatePatientFormSection").style.display = "none";
  
  // Clear search results
  document.getElementById("updateSearchResults").innerHTML = "";
});

// ==============================
// APPOINTMENT MANAGEMENT
// ==============================
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

// Auto-fill patient details when patient ID is entered
function autoFillPatientDetails() {
  const patientId = document.getElementById('appointmentPatientId').value.trim();
  const patientNameField = document.getElementById('appointmentPatientName');
  
  if (!patientId) {
    patientNameField.value = '';
    patientNameField.style.backgroundColor = '';
    return;
  }
  
  const patients = JSON.parse(localStorage.getItem('patients')) || [];
  const patient = patients.find(p => p.id === patientId);
  
  if (patient) {
    patientNameField.value = patient.name;
    patientNameField.style.backgroundColor = '#e8f5e8'; // Light green background
  } else {
    patientNameField.value = 'Patient not found';
    patientNameField.style.backgroundColor = '#ffe8e8'; // Light red background
  }
}

// Helper to round up a Date object to the next 5-minute mark
function roundUpToNext5Minutes(date) {
  const ms = 1000 * 60 * 5;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

// Initialize appointment form with proper date/time constraints
function initializeAppointmentForm() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getHours();

  const appointmentDateInput = document.getElementById('appointmentDate');
  const appointmentTimeInput = document.getElementById('appointmentTime');

  if (appointmentDateInput) {
    appointmentDateInput.min = today;
    appointmentDateInput.value = today;
  }

  if (appointmentTimeInput) {
    // If it's past clinic hours today, set minimum time to tomorrow
    if (currentHour >= 18) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      appointmentDateInput.value = tomorrow.toISOString().split('T')[0];
      appointmentTimeInput.min = '09:00';
    } else {
      // Set minimum time to current time + 30 minutes for today, rounded up to next 5-min mark
      const minTime = new Date();
      minTime.setMinutes(minTime.getMinutes() + 30);
      const roundedMinTime = roundUpToNext5Minutes(minTime);
      appointmentTimeInput.min = roundedMinTime.toTimeString().slice(0, 5);
    }
  }

  // Initially disable submit button until valid selections are made
  disableSubmitButton();

  // Add a note about the validation
  const form = document.getElementById('appointmentForm');
  if (form && !document.getElementById('validationNote')) {
    const note = document.createElement('div');
    note.id = 'validationNote';
    note.style.color = '#856404';
    note.style.padding = '10px';
    note.style.borderRadius = '5px';
    note.style.marginBottom = '15px';
    form.insertBefore(note, form.firstChild);
  }
}

// Load doctors for appointment scheduling
function loadDoctors() {
  const doctorSelect = document.getElementById('appointmentDoctor');
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  
  for (let key in localStorage) {
    if (key.startsWith('staff_')) {
      const staff = JSON.parse(localStorage.getItem(key));
      if (staff.role === 'Doctor' && staff.status === 'active') {
        const option = document.createElement('option');
        option.value = staff.staffId;
        option.textContent = `Dr. ${staff.name} - ${staff.specialization || 'General Medicine'}`;
        doctorSelect.appendChild(option);
      }
    }
  }
}

// Load appointments
function loadAppointments() {
  const appointmentsList = document.getElementById('appointmentsList');
  if (appointments.length === 0) {
    appointmentsList.innerHTML = '<p>No appointments scheduled.</p>';
    return;
  }
  let html = '<div id="patientsDisplayArea"><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  appointments.forEach(apt => {
    html += `<tr>
      <td>${apt.date}</td>
      <td>${apt.time}</td>
      <td>${apt.patientName}</td>
      <td>${apt.doctorName}</td>
      <td>${apt.status}</td>
      <td>
        <button onclick="cancelAppointment('${apt.id}')">Cancel</button>
        <button onclick="rescheduleAppointment('${apt.id}')">Reschedule</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  appointmentsList.innerHTML = html;
}

// Handle appointment form submission
document.getElementById('appointmentForm')?.addEventListener('submit', function(e) {
  e.preventDefault();

  // Check if submit button is disabled
  const submitButton = document.querySelector('#appointmentForm button[type="submit"]');
  if (submitButton && submitButton.disabled) {
    alert('❌ Please select a valid future date and time before scheduling the appointment.');
    return;
  }
  
  const patientId = document.getElementById('appointmentPatientId').value;
  const patients = JSON.parse(localStorage.getItem('patients')) || [];
  const patient = patients.find(p => p.id === patientId);
  
  if (!patient) {
    alert('Patient not found. Please add patient first.');
    return;
  }

  const doctorId = document.getElementById('appointmentDoctor').value;
  const appointmentDate = document.getElementById('appointmentDate').value;
  const appointmentTime = document.getElementById('appointmentTime').value;

  // STRICT validation for appointment date and time
  if (!appointmentDate || !appointmentTime) {
    alert('Please select both date and time for the appointment.');
    return;
  }

  // Create appointment datetime and current datetime
  const appointmentDateTime = new Date(appointmentDate + 'T' + appointmentTime);
  const currentDateTime = new Date();

  // For today, time must be at least 2 minutes from now
  const today = currentDateTime.toISOString().split('T')[0];
  if (appointmentDate === today) {
    const minDateTime = new Date();
    minDateTime.setMinutes(minDateTime.getMinutes() + 2);
    if (appointmentDateTime < minDateTime) {
      alert('For today, appointment time must be at least 2 minutes from now.');
      return;
    }
  }

  // Add 1 minute buffer to ensure we're truly in the future
  currentDateTime.setMinutes(currentDateTime.getMinutes() + 1);
  
  console.log('Appointment DateTime:', appointmentDateTime);
  console.log('Current DateTime:', currentDateTime);
  console.log('Is appointment in future?', appointmentDateTime > currentDateTime);
  
  if (appointmentDateTime <= currentDateTime) {
    alert('❌ INVALID: Appointments can only be scheduled for future dates and times.\n\nSelected: ' + appointmentDateTime.toLocaleString() + '\nCurrent: ' + currentDateTime.toLocaleString());
    return;
  }
  
  // Additional validation for clinic hours
  const appointmentHour = appointmentDateTime.getHours();
  const isMorningSession = (appointmentHour >= 9 && appointmentHour < 13);
  const isAfternoonSession = (appointmentHour >= 14 && appointmentHour < 18);
  
  if (!isMorningSession && !isAfternoonSession) {
    alert('Appointments must be scheduled during clinic hours (9 AM - 1 PM or 2 PM - 6 PM).');
    return;
  }
  
  if (appointmentHour === 13) {
    alert('Appointments cannot be scheduled during lunch break (1 PM - 2 PM).');
    return;
  }

  // Check doctor availability
  const availabilityCheck = checkDoctorAvailability(doctorId, appointmentDate, appointmentTime);
  
  if (!availabilityCheck.available) {
    alert(`Doctor is not available: ${availabilityCheck.reason}`);
    return;
  }

  const appointment = {
    id: Date.now().toString(),
    patientId: patientId,
    patientName: patient.name,
    doctorId: doctorId,
    doctorName: document.getElementById('appointmentDoctor').options[document.getElementById('appointmentDoctor').selectedIndex].text,
    date: appointmentDate,
    time: appointmentTime,
    reason: document.getElementById('appointmentReason').value,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  appointments.push(appointment);
  localStorage.setItem('appointments', JSON.stringify(appointments));
  
  // Automatically generate token for the doctor on the appointment date
  const generatedToken = generateTokenForAppointment(doctorId, appointmentDate, appointment.doctorName, appointmentTime);
  
  let successMessage = 'Appointment scheduled successfully!';
  if (generatedToken) {
    const sessionText = generatedToken.session === 'morning' ? 'Morning (9 AM - 1 PM)' : 'Afternoon (2 PM - 6 PM)';
    successMessage += `\nToken ${generatedToken.sessionTokenNumber} (${sessionText}) has been automatically generated for ${appointment.doctorName} on ${appointmentDate}.`;
  }
  
  alert(successMessage);
  this.reset();
  loadAppointments();
  displayAllTokensTable(); // Immediately update the tokens table after appointment
});

// Check doctor availability for a specific date and time
function checkDoctorAvailability(doctorId, date, time) {
  // Get doctor details
  let doctor = null;
  for (let key in localStorage) {
    if (key.startsWith('staff_')) {
      const staff = JSON.parse(localStorage.getItem(key));
      if (staff.staffId === doctorId && staff.role === 'Doctor') {
        doctor = staff;
        break;
      }
    }
  }

  if (!doctor) {
    return { available: false, reason: 'Doctor not found' };
  }

  // Check if doctor is active
  if (doctor.status !== 'active') {
    return { available: false, reason: 'Doctor is not active' };
  }

  // Check working days
  if (doctor.workingDays) {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const workingDays = doctor.workingDays.split(',').map(day => day.trim());
    
    if (!workingDays.includes(dayOfWeek)) {
      return { available: false, reason: `Doctor does not work on ${dayOfWeek}` };
    }
  }

  // Check for existing appointments at the same time
  const existingAppointments = appointments.filter(apt => 
    apt.doctorId === doctorId && 
    apt.date === date && 
    apt.time === time && 
    apt.status !== 'cancelled'
  );

  if (existingAppointments.length > 0) {
    return { available: false, reason: 'Doctor already has an appointment at this time' };
  }

  // Check if appointment time is within working hours (if specified)
  if (doctor.workingTime) {
    const workingTimeCheck = checkWorkingHours(time, doctor.workingTime);
    if (!workingTimeCheck.available) {
      return { available: false, reason: workingTimeCheck.reason };
    }
  }

  return { available: true, reason: 'Doctor is available' };
}

// Check if appointment time is within working hours
function checkWorkingHours(appointmentTime, workingTime) {
  // Default working hours if not specified
  const defaultStartTime = '09:00';
  const defaultEndTime = '18:00';
  
  let startTime, endTime;
  
  if (workingTime && workingTime.includes('-')) {
    const times = workingTime.split('-').map(t => t.trim());
    startTime = times[0];
    endTime = times[1];
  } else {
    startTime = defaultStartTime;
    endTime = defaultEndTime;
  }

  // Convert times to minutes for comparison
  const appointmentMinutes = convertTimeToMinutes(appointmentTime);
  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);

  // Check if appointment is within overall working hours
  if (appointmentMinutes < startMinutes || appointmentMinutes > endMinutes) {
    return { 
      available: false, 
      reason: `Appointment time must be between ${startTime} and ${endTime}` 
    };
  }

  // Check for lunch break (1 PM to 2 PM)
  const lunchStartMinutes = convertTimeToMinutes('13:00');
  const lunchEndMinutes = convertTimeToMinutes('14:00');
  
  if (appointmentMinutes >= lunchStartMinutes && appointmentMinutes < lunchEndMinutes) {
    return { 
      available: false, 
      reason: 'Appointments cannot be scheduled during lunch break (1 PM - 2 PM)' 
    };
  }

  return { available: true, reason: 'Time is within working hours' };
}

// Convert time string (HH:MM) to minutes
function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Add event listeners for real-time availability checking
document.getElementById('appointmentDoctor')?.addEventListener('change', checkAvailabilityOnChange);
document.getElementById('appointmentDate')?.addEventListener('change', function() {
  checkAvailabilityOnChange();
  validateAppointmentDateTime();
  
  // Clear time input when date changes to force user to select appropriate time
  const appointmentTimeInput = document.getElementById('appointmentTime');
  if (appointmentTimeInput) {
    appointmentTimeInput.value = '';
  }
});
document.getElementById('appointmentTime')?.addEventListener('change', function() {
  checkAvailabilityOnChange();
  validateAppointmentDateTime();
});

// Validate appointment date and time in real-time
function validateAppointmentDateTime() {
  const appointmentDate = document.getElementById('appointmentDate')?.value;
  const appointmentTime = document.getElementById('appointmentTime')?.value;
  const currentDateTime = new Date();
  const submitButton = document.querySelector('#appointmentForm button[type="submit"]');

  // Update minimum time for today's date
  if (appointmentDate) {
    const today = currentDateTime.toISOString().split('T')[0];
    const appointmentTimeInput = document.getElementById('appointmentTime');

    if (appointmentDate === today) {
      // If today is selected, set minimum time to current time + 30 minutes, rounded up to next 5-min mark
      const minTime = new Date();
      minTime.setMinutes(minTime.getMinutes() + 30);
      const roundedMinTime = roundUpToNext5Minutes(minTime);
      appointmentTimeInput.min = roundedMinTime.toTimeString().slice(0, 5);

      // If current time is past clinic hours, show message
      const currentHour = currentDateTime.getHours();
      if (currentHour >= 18) { // After 6 PM
        showDateTimeWarning('⚠️ Clinic is closed for today. Please select a future date.');
        disableSubmitButton();
        return;
      }
    } else {
      // For future dates, allow any time during clinic hours
      appointmentTimeInput.min = '09:00';
    }
  }

  if (appointmentDate && appointmentTime) {
    const appointmentDateTime = new Date(appointmentDate + 'T' + appointmentTime);
    // For today, must be at least 30 minutes from now
    const today = currentDateTime.toISOString().split('T')[0];
    if (appointmentDate === today) {
      const minDateTime = new Date();
      minDateTime.setMinutes(minDateTime.getMinutes() + 30);
      if (appointmentDateTime < minDateTime) {
        showDateTimeWarning('⚠️ For today, appointment time must be at least 30 minutes from now.');
        disableSubmitButton();
        return;
      }
    }
    // Check if appointment is within clinic hours
    const appointmentHour = appointmentDateTime.getHours();
    const appointmentMinutes = appointmentDateTime.getMinutes();
    
    // Morning session: 9 AM - 1 PM
    const isMorningSession = (appointmentHour >= 9 && appointmentHour < 13);
    // Afternoon session: 2 PM - 6 PM  
    const isAfternoonSession = (appointmentHour >= 14 && appointmentHour < 18);
    
    if (!isMorningSession && !isAfternoonSession) {
      showDateTimeWarning('⚠️ Appointment must be during clinic hours (9 AM - 1 PM or 2 PM - 6 PM).');
      disableSubmitButton();
    } else {
      // Check for lunch break
      if (appointmentHour === 13) {
        showDateTimeWarning('⚠️ Appointments cannot be scheduled during lunch break (1 PM - 2 PM).');
        disableSubmitButton();
      } else {
        clearDateTimeWarning();
        enableSubmitButton();
      }
    }
  } else {
    // If date or time is missing, disable submit button
    disableSubmitButton();
  }
}

// Disable submit button
function disableSubmitButton() {
  const submitButton = document.querySelector('#appointmentForm button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.style.backgroundColor = '#6c757d';
    submitButton.style.cursor = 'not-allowed';
    submitButton.title = 'Please select a valid future date and time';
  }
}

// Enable submit button
function enableSubmitButton() {
  const submitButton = document.querySelector('#appointmentForm button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.style.backgroundColor = '';
    submitButton.style.cursor = '';
    submitButton.title = '';
  }
}

// Validate date input to prevent past dates
function validateDateInput(input) {
  const selectedDate = new Date(input.value);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set to start of day
  
  if (selectedDate < currentDate) {
    alert('❌ Cannot select past dates! Please choose today or a future date.');
    input.value = currentDate.toISOString().split('T')[0]; // Reset to today
    return false;
  }
  
  // Update minimum time based on selected date
  const appointmentTimeInput = document.getElementById('appointmentTime');
  if (appointmentTimeInput) {
    if (selectedDate.toDateString() === currentDate.toDateString()) {
      // If today is selected, set minimum time to current time + 1 hour
      const now = new Date();
      now.setHours(now.getHours() + 1);
      appointmentTimeInput.min = now.toTimeString().slice(0, 5);
    } else {
      // For future dates, allow any time during clinic hours
      appointmentTimeInput.min = '09:00';
    }
  }
  
  return true;
}

// Real-time name validation
function validateNameInput(input) {
  const value = input.value;
  
  // Remove any non-alphabetic characters (except spaces)
  const cleanedValue = value.replace(/[^A-Za-z\s]/g, '');
  
  // Limit to 30 characters
  if (cleanedValue.length > 30) {
    input.value = cleanedValue.substring(0, 30);
  } else {
    input.value = cleanedValue;
  }
  
  // Update visual feedback
  if (input.value.length > 0) {
    if (input.value.length <= 30 && /^[A-Za-z\s]+$/.test(input.value)) {
      input.style.borderColor = '#28a745';
      input.style.backgroundColor = '#f8fff9';
    } else {
      input.style.borderColor = '#dc3545';
      input.style.backgroundColor = '#fff8f8';
    }
  } else {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
  }
}

// Real-time contact validation
function validateContactInput(input) {
  const value = input.value;
  
  // Remove any non-numeric characters
  const cleanedValue = value.replace(/[^0-9]/g, '');
  
  // Limit to 10 digits
  if (cleanedValue.length > 10) {
    input.value = cleanedValue.substring(0, 10);
  } else {
    input.value = cleanedValue;
  }
  
  // Update visual feedback
  if (input.value.length > 0) {
    if (input.value.length === 10 && /^[0-9]{10}$/.test(input.value)) {
      input.style.borderColor = '#28a745';
      input.style.backgroundColor = '#f8fff9';
      input.title = 'Valid contact number';
    } else if (input.value.length < 10) {
      input.style.borderColor = '#ffc107';
      input.style.backgroundColor = '#fffbf0';
      input.title = `Need ${10 - input.value.length} more digit(s)`;
    } else {
      input.style.borderColor = '#dc3545';
      input.style.backgroundColor = '#fff8f8';
      input.title = 'Invalid contact number';
    }
  } else {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
    input.title = '';
  }
}

// Validate time input to prevent past times
function validateTimeInput(input) {
  const selectedDate = document.getElementById('appointmentDate').value;
  const selectedTime = input.value;
  
  if (!selectedDate || !selectedTime) {
    return true;
  }
  
  const appointmentDateTime = new Date(selectedDate + 'T' + selectedTime);
  const currentDateTime = new Date();
  
  if (appointmentDateTime <= currentDateTime) {
    alert('❌ Cannot select past time! Please choose a future time.');
    
    // Set to current time + 1 hour
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 1);
    input.value = futureTime.toTimeString().slice(0, 5);
    return false;
  }
  
  return true;
}

// Show date/time warning
function showDateTimeWarning(message) {
  let warningElement = document.getElementById('dateTimeWarning');
  if (!warningElement) {
    warningElement = document.createElement('div');
    warningElement.id = 'dateTimeWarning';
    warningElement.style.color = '#dc3545';
    warningElement.style.fontSize = '14px';
    warningElement.style.marginTop = '5px';
    warningElement.style.padding = '8px';
    warningElement.style.backgroundColor = '#f8d7da';
    warningElement.style.border = '1px solid #f5c6cb';
    warningElement.style.borderRadius = '4px';
    document.getElementById('appointmentTime').parentNode.appendChild(warningElement);
  }
  warningElement.textContent = message;
}

// Clear date/time warning
function clearDateTimeWarning() {
  const warningElement = document.getElementById('dateTimeWarning');
  if (warningElement) {
    warningElement.remove();
  }
}

// Check availability when doctor, date, or time changes
function checkAvailabilityOnChange() {
  const doctorId = document.getElementById('appointmentDoctor').value;
  const date = document.getElementById('appointmentDate').value;
  const time = document.getElementById('appointmentTime').value;
  
  if (doctorId && date && time) {
    const availability = checkDoctorAvailability(doctorId, date, time);
    displayAvailabilityStatus(availability);
  } else {
    clearAvailabilityStatus();
  }
}

// Display availability status to user
function displayAvailabilityStatus(availability) {
  let statusElement = document.getElementById('availabilityStatus');
  
  if (!statusElement) {
    statusElement = document.createElement('div');
    statusElement.id = 'availabilityStatus';
    statusElement.style.marginTop = '10px';
    statusElement.style.padding = '10px';
    statusElement.style.borderRadius = '5px';
    document.getElementById('appointmentForm').appendChild(statusElement);
  }

  if (availability.available) {
    statusElement.innerHTML = `<span style="color: green;">✓ ${availability.reason}</span>`;
    statusElement.style.backgroundColor = '#d4edda';
    statusElement.style.border = '1px solid #c3e6cb';
  } else {
    statusElement.innerHTML = `<span style="color: red;">✗ ${availability.reason}</span>`;
    statusElement.style.backgroundColor = '#f8d7da';
    statusElement.style.border = '1px solid #f5c6cb';
  }
}

// Clear availability status
function clearAvailabilityStatus() {
  const statusElement = document.getElementById('availabilityStatus');
  if (statusElement) {
    statusElement.remove();
  }
}

// Auto-fill patient name when patient ID is entered
document.getElementById('appointmentPatientId')?.addEventListener('blur', function() {
  const patientId = this.value;
  const patients = JSON.parse(localStorage.getItem('patients')) || [];
  const patient = patients.find(p => p.id === patientId);
  
  if (patient) {
    document.getElementById('appointmentPatientName').value = patient.name;
  } else {
    document.getElementById('appointmentPatientName').value = '';
  }
});

// Cancel appointment
function cancelAppointment(appointmentId) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      appointment.status = 'cancelled';
      localStorage.setItem('appointments', JSON.stringify(appointments));
      loadAppointments();
    }
  }
}

// Reschedule appointment
function rescheduleAppointment(appointmentId) {
  const appointment = appointments.find(apt => apt.id === appointmentId);
  if (appointment) {
    document.getElementById('appointmentPatientId').value = appointment.patientId;
    document.getElementById('appointmentPatientName').value = appointment.patientName;
    document.getElementById('appointmentDoctor').value = appointment.doctorId;
    document.getElementById('appointmentDate').value = appointment.date;
    document.getElementById('appointmentTime').value = appointment.time;
    document.getElementById('appointmentReason').value = appointment.reason;
    
    // Remove the old appointment
    appointments = appointments.filter(apt => apt.id !== appointmentId);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    showSection('appointments');
  }
}

// ==============================
// TOKEN GENERATION
// ==============================
let tokens = JSON.parse(localStorage.getItem('tokens')) || [];

// Load doctors for token generation
function loadDoctorsForTokens() {
  const doctorSelect = document.getElementById('tokenDoctor');
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  
  for (let key in localStorage) {
    if (key.startsWith('staff_')) {
      const staff = JSON.parse(localStorage.getItem(key));
      if (staff.role === 'Doctor' && staff.status === 'active') {
        const option = document.createElement('option');
        option.value = staff.staffId;
        option.textContent = `Dr. ${staff.name}`;
        doctorSelect.appendChild(option);
      }
    }
  }
}

// Load token information
function loadTokenInfo() {
  const doctorId = document.getElementById('tokenDoctor').value;
  const date = document.getElementById('tokenDate').value;
  const tokenInfo = document.getElementById('tokenInfo');
  
  if (!doctorId || !date) {
    tokenInfo.innerHTML = '<p>Select doctor and date to view token availability</p>';
    return;
  }
  
  const dayTokens = tokens.filter(t => t.doctorId === doctorId && t.date === date);
  const morningTokens = dayTokens.filter(t => t.session === 'morning');
  const afternoonTokens = dayTokens.filter(t => t.session === 'afternoon');
  
  const morningUsed = morningTokens.length;
  const afternoonUsed = afternoonTokens.length;
  const totalUsed = dayTokens.length;
  
  tokenInfo.innerHTML = `
    <div style="background-color: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #003087;">📊 Token Summary</h4>
      <p><strong>Morning Session (9 AM - 1 PM):</strong> ${morningUsed}/15 tokens used</p>
      <p><strong>Afternoon Session (2 PM - 6 PM):</strong> ${afternoonUsed}/15 tokens used</p>
      <p><strong>Total Tokens Used:</strong> ${totalUsed}/30</p>
      <p><strong>Available Tokens:</strong> ${30 - totalUsed}</p>
    </div>
  `;
}

// Generate token for appointment (automatic)
function generateTokenForAppointment(doctorId, date, doctorName, appointmentTime) {
  // Determine session based on appointment time
  let session = '';
  let sessionTimeRange = '';
  
  if (appointmentTime >= '09:00' && appointmentTime < '13:00') {
    session = 'morning';
    sessionTimeRange = '9 AM - 1 PM';
  } else if (appointmentTime >= '14:00' && appointmentTime <= '18:00') {
    session = 'afternoon';
    sessionTimeRange = '2 PM - 6 PM';
  } else {
    console.log('Appointment time is outside clinic hours or during lunch break');
    return null;
  }
  
  // Check session-specific token limits
  const dayTokens = tokens.filter(t => t.doctorId === doctorId && t.date === date);
  const sessionTokens = dayTokens.filter(t => t.session === session);
  
  if (sessionTokens.length >= 15) {
    console.log(`Maximum tokens (15) already generated for ${session} session on this date.`);
    return null;
  }
  
  // Generate session-specific token number
  const sessionTokenNumber = sessionTokens.length + 1;
  const totalTokenNumber = dayTokens.length + 1;
  
  const token = {
    id: Date.now().toString(),
    doctorId: doctorId,
    doctorName: doctorName,
    date: date,
    session: session,
    sessionTokenNumber: sessionTokenNumber,
    totalTokenNumber: totalTokenNumber,
    appointmentTime: appointmentTime,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  tokens.push(token);
  localStorage.setItem('tokens', JSON.stringify(tokens));
  
  return token;
}

// Generate token (manual)
function generateToken() {
  const doctorId = document.getElementById('tokenDoctor').value;
  const date = document.getElementById('tokenDate').value;
  
  if (!doctorId || !date) {
    alert('Please select doctor and date.');
    return;
  }
  
  // Check which session has available slots
  const dayTokens = tokens.filter(t => t.doctorId === doctorId && t.date === date);
  const morningTokens = dayTokens.filter(t => t.session === 'morning');
  const afternoonTokens = dayTokens.filter(t => t.session === 'afternoon');
  
  let session = '';
  let sessionTokenNumber = 0;
  let sessionTimeRange = '';
  
  if (morningTokens.length < 15) {
    session = 'morning';
    sessionTokenNumber = morningTokens.length + 1;
    sessionTimeRange = '9 AM - 1 PM';
  } else if (afternoonTokens.length < 15) {
    session = 'afternoon';
    sessionTokenNumber = afternoonTokens.length + 1;
    sessionTimeRange = '2 PM - 6 PM';
  } else {
    alert('Maximum tokens (30) already generated for this doctor on this date.');
    return;
  }
  
  const totalTokenNumber = dayTokens.length + 1;
  
  const token = {
    id: Date.now().toString(),
    doctorId: doctorId,
    doctorName: document.getElementById('tokenDoctor').options[document.getElementById('tokenDoctor').selectedIndex].text,
    date: date,
    session: session,
    sessionTokenNumber: sessionTokenNumber,
    totalTokenNumber: totalTokenNumber,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  tokens.push(token);
  localStorage.setItem('tokens', JSON.stringify(tokens));
  
  alert(`Token ${sessionTokenNumber} (${sessionTimeRange}) generated successfully for ${token.doctorName} on ${date}`);
  loadTokenInfo();
}

// ==============================
// PATIENT LIST MANAGEMENT
// ==============================

// Display all patients with search functionality
function displayAllPatients() {
  const patientsDisplay = document.getElementById('patientsDisplayArea');
  patientsDisplay.innerHTML = "";

  const patients = JSON.parse(localStorage.getItem("patients")) || [];

  if (patients.length === 0) {
    patientsDisplay.innerHTML = "<p>No patients found in the system.</p>";
    return;
  }

  let table = `<table><tr><th>ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Email</th><th>Contact</th><th>Address</th><th>Registration Date</th></tr>`;
  
  patients.forEach(patient => {
    table += `<tr>
        <td>${patient.id}</td>
        <td>${patient.name}</td>
        <td>${patient.age}</td>
        <td>${patient.gender || 'N/A'}</td>
        <td>${patient.email || 'N/A'}</td>
        <td>${patient.contact}</td>
        <td>${patient.address || 'N/A'}</td>
        <td>${patient.registrationDate || 'N/A'}</td>
      </tr>`;
  });
  
  table += "</table>";
  patientsDisplay.innerHTML = table;
}

// Search and filter patients by name, ID, email, and registration date
function searchPatients() {
  const searchQuery = document.getElementById('searchPatientEmail').value.toLowerCase();
  const filterDate = document.getElementById('filterDate').value;
  const patientsDisplay = document.getElementById('patientsDisplayArea');
  
  // If no filters are applied, show all patients
  if (!searchQuery.trim() && !filterDate) {
    displayAllPatients();
    return;
  }
  
  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  let filteredPatients = patients;

  // Filter by search query (name, ID, email)
  if (searchQuery.trim()) {
    filteredPatients = filteredPatients.filter(patient => 
      patient.name.toLowerCase().includes(searchQuery) || 
      patient.id.toLowerCase().includes(searchQuery) ||
      patient.email.toLowerCase().includes(searchQuery) ||
      patient.contact.includes(searchQuery)
    );
  }

  // Filter by specific date
  if (filterDate) {
    filteredPatients = filteredPatients.filter(patient => {
      if (!patient.registrationDate) return false;
      return patient.registrationDate === filterDate;
    });
  }

  if (filteredPatients.length === 0) {
    patientsDisplay.innerHTML = "<p>No patients found matching your criteria.</p>";
    return;
  }

  let table = `<table><tr><th>ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Email</th><th>Contact</th><th>Address</th><th>Registration Date</th></tr>`;
  
  filteredPatients.forEach(patient => {
    table += `<tr>
        <td>${patient.id}</td>
        <td>${patient.name}</td>
        <td>${patient.age}</td>
        <td>${patient.gender || 'N/A'}</td>
        <td>${patient.email || 'N/A'}</td>
        <td>${patient.contact}</td>
        <td>${patient.address || 'N/A'}</td>
        <td>${patient.registrationDate || 'N/A'}</td>
      </tr>`;
  });
  
  table += "</table>";
  patientsDisplay.innerHTML = table;
}

// Clear all filters and show all patients
function clearFilters() {
  document.getElementById('searchPatientEmail').value = '';
  document.getElementById('filterDate').value = '';
  displayAllPatients();
}

// Edit patient from the list
function editPatientFromList(patientId) {
  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  const patient = patients.find(p => p.id === patientId);

  if (!patient) {
    alert("Patient not found.");
    return;
  }

  // Populate the update patient form
  showSection('updatePatient');
  
  // Create the edit form dynamically
  const updateResults = document.getElementById('updateResults');
  updateResults.innerHTML = `
    <h4>Update Patient: ${patient.name}</h4>
    <form id="updatePatientForm">
      <label>Name: <input type="text" name="name" value="${patient.name}" required></label><br>
      <label>Age: <input type="number" name="age" value="${patient.age}" required></label><br>
      <label>Contact: <input type="tel" name="contact" value="${patient.contact}" required></label><br>
      <label>Address: <input type="text" name="address" value="${patient.address || ''}"></label><br>
      <label>Medical History: <textarea name="history">${patient.history || ''}</textarea></label><br>
      <button type="submit">Save Changes</button>
      <button type="button" onclick="showSection('viewAllPatients')">Cancel</button>
    </form>
  `;

  document.getElementById('updatePatientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const updatedPatient = Object.fromEntries(formData);
    updatedPatient.id = patient.id;
    updatedPatient.status = patient.status;

    const newPatients = patients.map(p => p.id === patient.id ? updatedPatient : p);
    localStorage.setItem("patients", JSON.stringify(newPatients));

    alert("Patient updated successfully!");
    showSection('viewAllPatients');
  });
}

// Deactivate patient
function deactivatePatient(patientId) {
  if (confirm('Are you sure you want to deactivate this patient?')) {
    const patients = JSON.parse(localStorage.getItem("patients")) || [];
    const patient = patients.find(p => p.id === patientId);
    
    if (patient) {
      patient.status = "inactive";
      localStorage.setItem("patients", JSON.stringify(patients));
      displayAllPatients();
    }
  }
}

// Activate patient
function activatePatient(patientId) {
  if (confirm('Are you sure you want to activate this patient?')) {
    const patients = JSON.parse(localStorage.getItem("patients")) || [];
    const patient = patients.find(p => p.id === patientId);
    
    if (patient) {
      patient.status = "active";
      localStorage.setItem("patients", JSON.stringify(patients));
      displayAllPatients();
    }
  }
}

// View patient history (consultations, appointments, etc.)
function viewPatientHistory(patientId) {
  // Hide all sections, show only patientHistory
  document.querySelectorAll('main section').forEach(section => {
    section.classList.add('hidden');
  });
  document.getElementById('patientHistory').classList.remove('hidden');
  const area = document.getElementById('patientHistoryArea');

  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  const patient = patients.find(p => p.id === patientId);
  
  if (!patient) {
    alert("Patient not found.");
    return;
  }

  // Get consultations for this patient
  const consultations = JSON.parse(localStorage.getItem('consultations')) || [];
  const patientConsultations = consultations.filter(c => c.patientId === patientId);
  
  // Get appointments for this patient
  const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
  const patientAppointments = appointments.filter(a => a.patientId === patientId);
  
  // Get prescriptions for this patient
  const prescriptions = JSON.parse(localStorage.getItem('prescriptions')) || [];
  const patientPrescriptions = prescriptions.filter(p => p.patientId === patientId);

  let historyHTML = `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4>Patient History: ${patient.name} (ID: ${patient.id})</h4>
      
      <h5>Consultations (${patientConsultations.length})</h5>
      ${patientConsultations.length > 0 ? 
        patientConsultations.map(c => `
          <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 5px;">
            <strong>Date:</strong> ${c.date} | <strong>Diagnosis:</strong> ${c.diagnosis}<br>
            <strong>Treatment:</strong> ${c.treatmentPlan}
          </div>
        `).join('') : '<p>No consultations found.</p>'}
      
      <h5>Appointments (${patientAppointments.length})</h5>
      ${patientAppointments.length > 0 ? 
        patientAppointments.map(a => `
          <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 5px;">
            <strong>Date:</strong> ${a.date} | <strong>Time:</strong> ${a.time} | <strong>Status:</strong> ${a.status}<br>
            <strong>Doctor:</strong> ${a.doctorName} | <strong>Reason:</strong> ${a.reason || 'N/A'}
          </div>
        `).join('') : '<p>No appointments found.</p>'}
      
      <h5>Prescriptions (${patientPrescriptions.length})</h5>
      ${patientPrescriptions.length > 0 ? 
        patientPrescriptions.map(p => `
          <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 5px;">
            <strong>Medications:</strong> ${p.meds}<br>
            <strong>Date:</strong> ${new Date(p.id).toLocaleDateString()}
          </div>
        `).join('') : '<p>No prescriptions found.</p>'}
      
      <button onclick="showSection('viewAllPatients')" style="margin-top: 15px;">Back to Patient List</button>
    </div>
  `;

  area.innerHTML = historyHTML;
}

// ==============================
// LOGOUT
// ==============================
function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("sessionStart");
  alert("You have been logged out.");
  window.location.href = "/HTML/Admin/admin_login.html";
}

// Display available time slots for selected doctor and date
function showAvailableTimeSlots() {
  const doctorId = document.getElementById('appointmentDoctor').value;
  const date = document.getElementById('appointmentDate').value;
  
  if (!doctorId || !date) {
    return;
  }

  // Get doctor details
  let doctor = null;
  for (let key in localStorage) {
    if (key.startsWith('staff_')) {
      const staff = JSON.parse(localStorage.getItem(key));
      if (staff.staffId === doctorId && staff.role === 'Doctor') {
        doctor = staff;
        break;
      }
    }
  }

  if (!doctor) {
    return;
  }

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const timeSlots = [];
  const startHour = 9;
  const endHour = 17;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let minTime = null;
  if (date === todayStr) {
    minTime = new Date();
    minTime.setMinutes(minTime.getMinutes() + 30);
  }
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      // Filter out past slots for today
      if (minTime) {
        const slotDateTime = new Date(date + 'T' + time);
        if (slotDateTime < minTime) continue;
      }
      // Check if this time slot is available
      const availability = checkDoctorAvailability(doctorId, date, time);
      if (availability.available) {
        timeSlots.push({
          time: time,
          available: true
        });
      } else {
        timeSlots.push({
          time: time,
          available: false,
          reason: availability.reason
        });
      }
    }
  }
  // Display available time slots
  displayTimeSlots(timeSlots);
}

// Display time slots to user
function displayTimeSlots(timeSlots) {
  let slotsElement = document.getElementById('timeSlotsContainer');
  
  if (!slotsElement) {
    slotsElement = document.createElement('div');
    slotsElement.id = 'timeSlotsContainer';
    slotsElement.style.marginTop = '15px';
    slotsElement.style.padding = '15px';
    slotsElement.style.backgroundColor = '#f8f9fa';
    slotsElement.style.borderRadius = '5px';
    slotsElement.style.border = '1px solid #e9ecef';
    document.getElementById('appointmentForm').appendChild(slotsElement);
  }

  const availableSlots = timeSlots.filter(slot => slot.available);
  const unavailableSlots = timeSlots.filter(slot => !slot.available);

  let html = '<h5>Available Time Slots:</h5>';
  
  if (availableSlots.length > 0) {
    html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">';
    availableSlots.forEach(slot => {
      html += `<span style="padding: 6px 10px; background-color: #e6f4ea; color: #218838; border-radius: 4px; font-weight: 500; font-size: 1em;">${slot.time}</span>`;
    });
    html += '</div>';
  } else {
    html += '<p style="color: red;">No available time slots for this date.</p>';
  }

  if (unavailableSlots.length > 0) {
    html += '<h6>Unavailable Slots:</h6>';
    html += '<div style="font-size: 0.9em; color: #666;">';
    unavailableSlots.forEach(slot => {
      html += `<div>${slot.time}: ${slot.reason}</div>`;
    });
    html += '</div>';
  }

  slotsElement.innerHTML = html;
}

// Enhanced event listeners for better user experience
document.getElementById('appointmentDoctor')?.addEventListener('change', function() {
  clearAvailabilityStatus();
  clearTimeSlots();
  if (this.value && document.getElementById('appointmentDate').value) {
    showAvailableTimeSlots();
  }
});

document.getElementById('appointmentDate')?.addEventListener('change', function() {
  clearAvailabilityStatus();
  clearTimeSlots();
  if (this.value && document.getElementById('appointmentDoctor').value) {
    showAvailableTimeSlots();
  }
});

// Clear time slots display
function clearTimeSlots() {
  const slotsElement = document.getElementById('timeSlotsContainer');
  if (slotsElement) {
    slotsElement.remove();
  }
}

// Unified search for update patient
function searchPatientForUpdateUnified() {
  const query = document.getElementById("updateSearchUnified").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("updateSearchResults");
  resultsDiv.innerHTML = "";
  if (!query) { displayAllPatientsForUpdate(); return; }
  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  let results = patients.filter(p =>
    (p.id && p.id.toLowerCase().includes(query)) ||
    (p.name && p.name.toLowerCase().includes(query)) ||
    (p.email && p.email.toLowerCase().includes(query))
  );
  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No patients found matching your search criteria.</p>";
    return;
  }
  results.forEach(patient => {
    const div = document.createElement("div");
    div.className = "patient-result-item";
    div.onclick = () => loadPatientForUpdate(patient.id);
    div.innerHTML = `
      <h5>${patient.name} (ID: ${patient.id})</h5>
      <p><strong>Age:</strong> ${patient.age} | <strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
      <p><strong>Email:</strong> ${patient.email || 'N/A'} | <strong>Contact:</strong> ${patient.contact}</p>
      <p><strong>Status:</strong> <span style="color: ${patient.status === 'active' ? 'green' : 'red'}">${patient.status}</span></p>
      <p><strong>Registration Date:</strong> ${formatToDDMMYYYY(patient.registrationDate) || 'N/A'}</p>
      <small>Click to edit this patient</small>
    `;
    resultsDiv.appendChild(div);
  });
}

// Display all patients in a table by default
function displayAllPatientsTable(patients) {
  const displayArea = document.getElementById("patientsDisplayArea");
  if (!patients || patients.length === 0) {
    displayArea.innerHTML = "<p>No patients found.</p>";
    return;
  }
  let html = `<table><thead><tr><th>ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Email</th><th>Contact</th><th>Address</th><th>Registration Date</th></tr></thead><tbody>`;
  patients.forEach(patient => {
    html += `<tr>
      <td>${patient.id}</td>
      <td>${patient.name}</td>
      <td>${patient.age}</td>
      <td>${patient.gender || 'N/A'}</td>
      <td>${patient.email || 'N/A'}</td>
      <td>${patient.contact}</td>
      <td>${patient.address || 'N/A'}</td>
      <td>${formatToDDMMYYYY(patient.registrationDate) || 'N/A'}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  displayArea.innerHTML = html;
}

// On section show, display all patients
const origShowSectionVP = showSection;
showSection = function(sectionId) {
  origShowSectionVP(sectionId);
  if (sectionId === 'viewAllPatients') {
    const patients = JSON.parse(localStorage.getItem("patients")) || [];
    displayAllPatientsTable(patients);
  }
  if (sectionId === 'report') displayBillingReportsTable();
  if (sectionId === 'tokens') displayAllTokensTable();
}

// Update searchPatientsUnified to filter the table
function searchPatientsUnified() {
  const nameOrIdQuery = document.getElementById("searchName").value.trim().toLowerCase();
  const dateQuery = document.getElementById("searchDate").value;
  const patients = JSON.parse(localStorage.getItem("patients")) || [];
  let results = patients.filter(p => {
    const nameMatch = nameOrIdQuery ? (p.name && p.name.toLowerCase().includes(nameOrIdQuery)) : false;
    const idMatch = nameOrIdQuery ? (p.id && p.id.toLowerCase().includes(nameOrIdQuery)) : false;
    const dateMatch = dateQuery ? (p.registrationDate === dateQuery) : true;
    return (nameOrIdQuery ? (nameMatch || idMatch) : true) && dateMatch;
  });
  displayAllPatientsTable(results);
}

// Format date to dd-mm-yyyy
function formatToDDMMYYYY(isoDate) {
  if (!isoDate) return '';
  const [yyyy, mm, dd] = isoDate.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

document.getElementById("updateSearchUnified")?.addEventListener("keyup", function(e) {
  if (e.key === "Enter") searchPatientForUpdateUnified();
});
document.getElementById("searchUnified")?.addEventListener("keyup", function(e) {
  if (e.key === "Enter") searchPatientsUnified();
});

// Display billing reports for all appointments
function displayBillingReportsTable() {
  const nameOrIdQuery = document.getElementById('billingSearchName')?.value.trim().toLowerCase() || '';
  const dateQuery = document.getElementById('billingSearchDate')?.value || '';
  const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
  const staffKeys = Object.keys(localStorage).filter(k => k.startsWith('staff_'));
  const staffList = staffKeys.map(k => JSON.parse(localStorage.getItem(k)));
  let filtered = appointments.filter(apt => {
    const nameMatch = nameOrIdQuery ? (apt.patientName && apt.patientName.toLowerCase().includes(nameOrIdQuery)) : false;
    const idMatch = nameOrIdQuery ? (apt.patientId && apt.patientId.toLowerCase().includes(nameOrIdQuery)) : false;
    const dateMatch = dateQuery ? (apt.date === dateQuery) : true;
    return (nameOrIdQuery ? (nameMatch || idMatch) : true) && dateMatch;
  });
  let html = `<div id="patientsDisplayArea"><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Patient ID</th><th>Doctor</th><th>Charge</th><th>Status</th></tr></thead><tbody>`;
  filtered.forEach(apt => {
    const doctor = staffList.find(s => s.staffId === apt.doctorId);
    const charge = doctor && doctor.charge ? doctor.charge : 'N/A';
    html += `<tr>
      <td>${formatToDDMMYYYY(apt.date)}</td>
      <td>${apt.time}</td>
      <td>${apt.patientName}</td>
      <td>${apt.patientId || ''}</td>
      <td>${apt.doctorName}</td>
      <td>${charge}</td>
      <td>${apt.status}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('billingReportsTable').innerHTML = html;
}

// Display all tokens with appointments and token numbers
function displayAllTokensTable() {
  const doctorId = document.getElementById('tokenDoctor').value;
  const date = document.getElementById('tokenDate').value;
  const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
  const tokens = JSON.parse(localStorage.getItem('tokens')) || [];
  let filtered = appointments.filter(a =>
    (!doctorId || a.doctorId === doctorId) &&
    (!date || a.date === date)
  );
  let html = `<div id="patientsDisplayArea"><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Token Number</th><th>Status</th></tr></thead><tbody>`;
  filtered.forEach(apt => {
    const token = tokens.find(t => t.doctorId === apt.doctorId && t.date === apt.date && t.appointmentTime === apt.time);
    html += `<tr>
      <td>${formatToDDMMYYYY(apt.date)}</td>
      <td>${apt.time}</td>
      <td>${apt.patientName}</td>
      <td>${apt.doctorName}</td>
      <td>${token ? token.sessionTokenNumber : 'N/A'}</td>
      <td>${apt.status}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('allTokensTable').innerHTML = html;
}

// Show billing reports and tokens table when sections are shown
const origShowSection = showSection;
showSection = function(sectionId) {
  origShowSection(sectionId);
  if (sectionId === 'report') displayBillingReportsTable();
  if (sectionId === 'tokens') displayAllTokensTable();
}

// Add Enter key event listeners for View Patients search
const searchNameInput = document.getElementById('searchName');
const searchDateInput = document.getElementById('searchDate');
if (searchNameInput) {
  searchNameInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') searchPatientsUnified();
  });
}
if (searchDateInput) {
  searchDateInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') searchPatientsUnified();
  });
}
// Add Enter key event listeners for Billing Reports search
const billingNameInput = document.getElementById('billingSearchName');
const billingDateInput = document.getElementById('billingSearchDate');
if (billingNameInput) {
  billingNameInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') displayBillingReportsTable();
  });
}
if (billingDateInput) {
  billingDateInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') displayBillingReportsTable();
  });
}

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
