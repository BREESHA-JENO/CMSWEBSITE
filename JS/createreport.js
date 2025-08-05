// ================= CREATEREPORT.JS =================

document.addEventListener("DOMContentLoaded", function () {
  // --- Session Management for Lab Technician ---
  const loggedIn = localStorage.getItem("loggedInUser");
  const sessionStart = localStorage.getItem("sessionStart");
  const MAX_SESSION_DURATION = 1 * 60 * 1000; // 1 minute for demo
  if (!loggedIn || !sessionStart) {
    alert("Please login first.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }
  const user = JSON.parse(loggedIn);
  if (user.role !== "Lab Technician") {
    alert("Access denied. Lab Technician privileges required.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }
  // Session timeout check
  if (Date.now() - parseInt(sessionStart) > MAX_SESSION_DURATION) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("sessionStart");
    alert("Session expired. Please login again.");
    window.location.replace("/HTML/Admin/admin_login.html");
    return;
  }
  // Update session on activity
  ["click", "keydown", "mousemove", "scroll"].forEach(event => {
    document.addEventListener(event, function() {
      localStorage.setItem("sessionStart", Date.now().toString());
    });
  });
  setInterval(function() {
    const sessionStart = parseInt(localStorage.getItem("sessionStart"));
    if (!sessionStart || Date.now() - sessionStart > MAX_SESSION_DURATION) {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("sessionStart");
      alert("Session expired. Please login again.");
      window.location.replace("/HTML/Admin/admin_login.html");
    }
  }, 60000);
  // --- End Session Management ---

  // === Lab Order Loading and Form Population ===
  const selectedIdx = parseInt(localStorage.getItem('selectedLabOrderIdx'));
  const labOrders = JSON.parse(localStorage.getItem('labOrders') || '[]');
  const order = labOrders[selectedIdx];
  if (!order) {
    alert('No lab order selected.');
    window.location.replace('/HTML/Lab/labhome.html');
    return;
  }

  // Populate form fields
  document.getElementById('date').value = order.date || '';
  document.getElementById('patientid').value = order.patientId || '';
  document.getElementById('patientName').value = order.patientName || '';
  document.getElementById('doctorName').value = order.doctorName || '';
  document.getElementById('testName').value = order.testName || '';
  // Optionally populate highrange, lowrange, actualreading, result if present
  if (order.highRange) document.getElementById('highrange').value = order.highRange;
  if (order.lowRange) document.getElementById('lowrange').value = order.lowRange;
  if (order.actualReading) document.getElementById('actualreading').value = order.actualReading;
  if (order.result) document.getElementById('result').value = order.result;

  // If already completed, make form read-only and hide submit
  if (order.status === 'completed') {
    Array.from(document.querySelectorAll('#reportForm input, #reportForm textarea, #reportForm select')).forEach(el => {
      el.setAttribute('readonly', 'readonly');
      el.setAttribute('disabled', 'disabled');
    });
    document.querySelector('#reportForm button[type="submit"]').style.display = 'none';
    messageDiv.innerHTML = `<div class="alert alert-info">This report has already been submitted and cannot be edited.</div>`;
  }

  const form = document.getElementById("reportForm");
  const messageDiv = document.getElementById("reportMessage");

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form from refreshing
    if (order.status === 'completed') return;

    const date = document.getElementById("date").value.trim();
    const patientId = document.getElementById("patientid").value.trim();
    const patientName = document.getElementById("patientName").value.trim();
    const doctorName = document.getElementById("doctorName").value.trim();
    const testName = document.getElementById("testName").value;
    const highRange = parseFloat(document.getElementById("highrange").value);
    const lowRange = parseFloat(document.getElementById("lowrange").value);
    const actualReading = parseFloat(document.getElementById("actualreading").value);
    const result = document.getElementById("result").value.trim();

    let errors = [];
    if (!date || !patientId || !patientName || !doctorName || !testName || !result) {
      errors.push("Please fill in all required fields.");
    }
    if (isNaN(highRange) || isNaN(lowRange) || isNaN(actualReading)) {
      errors.push("High, Low and Actual reading must be valid numbers.");
    } else {
      if (lowRange >= highRange) {
        errors.push("Low Range must be less than High Range.");
      }
    }
    if (errors.length > 0) {
      messageDiv.innerHTML = `<div class="alert alert-danger">${errors.join("<br>")}</div>`;
      return;
    }

    // Update the lab order in the array
    labOrders[selectedIdx] = {
      ...order,
      date,
      patientId,
      patientName,
      doctorName,
      testName,
      highRange,
      lowRange,
      actualReading,
      result,
      status: 'completed',
    };
    localStorage.setItem('labOrders', JSON.stringify(labOrders));

    // Optionally, also add to labReports for viewreport page compatibility
    const reports = JSON.parse(localStorage.getItem("labReports") || "[]");
    reports.push(labOrders[selectedIdx]);
    localStorage.setItem("labReports", JSON.stringify(reports));

    messageDiv.innerHTML = `<div class="alert alert-success">Report submitted successfully.</div>`;
    Array.from(document.querySelectorAll('#reportForm input, #reportForm textarea, #reportForm select')).forEach(el => {
      el.setAttribute('readonly', 'readonly');
      el.setAttribute('disabled', 'disabled');
    });
    document.querySelector('#reportForm button[type="submit"]').style.display = 'none';
  });
});
