
{/* <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script> */}
// Search on form submit
document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault();
  performTestSearch();
});

// Real-time search as user types
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', performTestSearch);
}

function performTestSearch() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const cards = document.querySelectorAll('#test-section .col-md-4');
  let found = false;

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    if (text.includes(query)) {
      card.style.display = '';
      found = true;
    } else {
      card.style.display = 'none';
    }
  });

  // Show/hide "No Results" message
  const noResults = document.getElementById('noResults');
  if (noResults) {
    noResults.style.display = found ? 'none' : '';
  }
}
