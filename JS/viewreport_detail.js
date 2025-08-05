document.addEventListener('DOMContentLoaded', function() {
  const idx = parseInt(localStorage.getItem('selectedLabReportIdx'));
  const reports = JSON.parse(localStorage.getItem('labReports') || '[]');
  const report = reports[idx];
  const detailsDiv = document.getElementById('reportDetails');
  if (!report) {
    detailsDiv.innerHTML = '<div class="alert alert-danger">Report not found.</div>';
    return;
  }
  detailsDiv.innerHTML = `
    <ul class="list-group">
      <li class="list-group-item"><strong>Date:</strong> ${report.date}</li>
      <li class="list-group-item"><strong>Patient ID:</strong> ${report.patientId}</li>
      <li class="list-group-item"><strong>Patient Name:</strong> ${report.patientName}</li>
      <li class="list-group-item"><strong>Doctor Name:</strong> ${report.doctorName}</li>
      <li class="list-group-item"><strong>Test Name:</strong> ${report.testName}</li>
      <li class="list-group-item"><strong>High Range:</strong> ${report.highRange}</li>
      <li class="list-group-item"><strong>Low Range:</strong> ${report.lowRange}</li>
      <li class="list-group-item"><strong>Actual Reading:</strong> ${report.actualReading}</li>
      <li class="list-group-item"><strong>Observation:</strong> ${report.result}</li>
    </ul>
  `;
}); 