document.addEventListener("DOMContentLoaded", () => {
  const resultDiv = document.getElementById("allReports");

  function renderReports(reports) {
    if (!reports || reports.length === 0) {
      resultDiv.innerHTML = `<div class="alert alert-warning">No reports found.</div>`;
      return;
    }

    resultDiv.innerHTML = reports
      .map(r => `
        <div class="report-card">
          <div class="card-body">
            <div class="patient-name">${r.patientName} <span style='font-size:0.95em;color:#888;'>(ID: ${r.patientId})</span></div>
            <div class="card-title">${r.testName}</div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><strong>Date:</strong> ${r.date}</li>
              <li class="list-group-item"><strong>Doctor Name:</strong> ${r.doctorName}</li>
              <li class="list-group-item"><strong>High Range:</strong> ${r.highRange}</li>
              <li class="list-group-item"><strong>Low Range:</strong> ${r.lowRange}</li>
              <li class="list-group-item"><strong>Actual Reading:</strong> ${r.actualReading}</li>
              <li class="list-group-item"><strong>Observation:</strong> ${r.result}</li>
            </ul>
          </div>
        </div>
      `)
      .join("");
  }

  const storedReports = JSON.parse(localStorage.getItem("labReports") || "[]");
  renderReports(storedReports);
});
