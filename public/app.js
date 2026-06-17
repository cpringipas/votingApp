// State Variables
let allStudents = [];
let categories = [];
let currentUser = null;
let currentPassword = '';
let userVotes = {};

// Helper: Normalize Greek string (lowercase, remove accents)
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ');
}

// Helper: Show notification toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// -------------------------------------------------------------
// INITIALIZATION & DATA FETCHING
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadInitialData();
});

async function loadInitialData() {
  try {
    // Fetch categories and students in parallel
    const [catResponse, studResponse] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/students')
    ]);

    if (!catResponse.ok || !studResponse.ok) {
      throw new Error('Σφάλμα κατά τη φόρτωση των αρχικών δεδομένων.');
    }

    categories = await catResponse.json();
    allStudents = await studResponse.json();

    // Enable the login class select once data is ready
    document.getElementById('class-select').disabled = false;
  } catch (error) {
    console.error('Data load error:', error);
    showToast('Αδυναμία σύνδεσης με τον διακομιστή.', 'error');
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS SETUP
// -------------------------------------------------------------
function setupEventListeners() {
  const classSelect = document.getElementById('class-select');
  const studentSelect = document.getElementById('student-select');
  const loginForm = document.getElementById('login-form');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password-input');
  const logoutBtn = document.getElementById('logout-btn');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const votingForm = document.getElementById('voting-form');
  const globalSearch = document.getElementById('global-search');
  const adminExportBtn = document.getElementById('admin-export-btn');

  // Login: Populating student select when class is chosen
  classSelect.addEventListener('change', () => {
    const selectedClass = classSelect.value;
    studentSelect.innerHTML = '<option value="" disabled selected>Επιλέξτε Ονοματεπώνυμο...</option>';
    
    const filtered = allStudents.filter(s => s.class === selectedClass)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'el'));
    
    filtered.forEach(student => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = student.fullName;
      studentSelect.appendChild(option);
    });
    
    studentSelect.disabled = false;
  });

  // Login: Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      togglePasswordBtn.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      togglePasswordBtn.textContent = '👁️';
    }
  });

  // Login: Handle form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = studentSelect.value;
    const password = passwordInput.value;
    const loginError = document.getElementById('login-error');
    const loginSubmitBtn = document.getElementById('login-submit-btn');

    if (!studentId || !password) return;

    loginError.classList.add('hidden');
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.querySelector('span').textContent = 'Σύνδεση...';

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        currentUser = data.student;
        currentPassword = password;
        userVotes = data.existingVotes || {};
        
        showToast(`Καλώς ήρθες, ${currentUser.fullName}!`, 'success');
        transitionToDashboard();
      } else {
        // Failed login
        loginError.innerText = data.error || 'Σφάλμα κατά τη σύνδεση.';
        loginError.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      loginError.innerText = 'Σφάλμα δικτύου. Παρακαλώ δοκιμάστε ξανά.';
      loginError.classList.remove('hidden');
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.querySelector('span').textContent = 'Είσοδος';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    currentPassword = '';
    userVotes = {};
    
    // Clear forms
    passwordInput.value = '';
    loginForm.reset();
    studentSelect.innerHTML = '<option value="" disabled selected>Πρώτα επιλέξτε τμήμα...</option>';
    studentSelect.disabled = true;

    // Transition back to login
    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    
    showToast('Αποσυνδεθήκατε επιτυχώς.', 'success');
  });

  // Dashboard Tabs (Voting vs Results)
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');

      if (tabId === 'results-tab') {
        loadAndRenderResults();
      }
    });
  });

  // Global Student Lookup (Helper Box)
  globalSearch.addEventListener('input', () => {
    const query = normalize(globalSearch.value.trim());
    const resultsContainer = document.getElementById('global-search-results');
    
    if (query.length < 2) {
      resultsContainer.classList.add('hidden');
      resultsContainer.innerHTML = '';
      return;
    }

    const matches = allStudents.filter(s => {
      return normalize(s.fullName).includes(query) || normalize(s.class).includes(query);
    }).slice(0, 5); // limit to 5

    if (matches.length === 0) {
      resultsContainer.innerHTML = '<div class="search-result-item">Δεν βρέθηκαν αποτελέσματα</div>';
    } else {
      resultsContainer.innerHTML = matches.map(s => `
        <div class="search-result-item" onclick="selectGlobalSearchOption('${s.fullName}')">
          ${s.fullName} <span>Τμήμα ${s.class}</span>
        </div>
      `).join('');
    }
    
    resultsContainer.classList.remove('hidden');
  });

  // Close search results on click outside
  document.addEventListener('click', (e) => {
    if (!globalSearch.contains(e.target)) {
      document.getElementById('global-search-results').classList.add('hidden');
    }
    
    // Also close any open comboboxes
    const openComboboxes = document.querySelectorAll('.combobox-container.open');
    openComboboxes.forEach(combo => {
      if (!combo.contains(e.target)) {
        combo.classList.remove('open');
      }
    });
  });

  // Voting Form Submit
  votingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-votes-btn');
    
    saveBtn.disabled = true;
    saveBtn.querySelector('span').textContent = 'Αποθήκευση...';

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.id,
          password: currentPassword,
          votes: userVotes
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Οι ψήφοι σας αποθηκεύτηκαν επιτυχώς!', 'success');
        updateVotingProgress();
      } else {
        showToast(data.error || 'Σφάλμα κατά την αποθήκευση.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Σφάλμα δικτύου κατά την αποθήκευση των ψήφων.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.querySelector('span').textContent = 'Αποθήκευση Ψήφων';
    }
  });

  // Admin Export Button
  adminExportBtn.addEventListener('click', () => {
    // Open in a new tab/download
    window.location.href = '/api/admin/export';
  });
}

// Global search quick selection click handler
window.selectGlobalSearchOption = function(name) {
  const globalSearch = document.getElementById('global-search');
  globalSearch.value = name;
  document.getElementById('global-search-results').classList.add('hidden');
};

// -------------------------------------------------------------
// SCREEN TRANSITIONS
// -------------------------------------------------------------
function transitionToDashboard() {
  document.getElementById('user-display-name').textContent = currentUser.fullName;
  document.getElementById('user-display-class').textContent = `Τμήμα ${currentUser.class}`;

  // Reset tab active state
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="voting-tab"]').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  document.getElementById('voting-tab').classList.add('active');

  // Clear global search
  document.getElementById('global-search').value = '';

  // Render voting interface
  renderVotingCategories();
  updateVotingProgress();

  // Screen transition
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('dashboard-screen').classList.add('active');
}

// -------------------------------------------------------------
// RENDER VOTING INTERFACE
// -------------------------------------------------------------
function renderVotingCategories() {
  const container = document.getElementById('categories-container');
  container.innerHTML = '';

  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = `card glass-card category-card ${userVotes[cat.id] ? 'has-vote' : ''}`;
    card.id = `cat-card-${cat.id}`;

    // Header info of card
    const headerHtml = `
      <div class="category-info">
        <div class="category-emoji">${cat.emoji}</div>
        <div class="category-title">${cat.label}</div>
      </div>
    `;

    // Inner Interactive wrapper for vote selection
    const interactiveWrapper = document.createElement('div');
    interactiveWrapper.className = 'category-interactive-wrapper';
    interactiveWrapper.id = `cat-interactive-${cat.id}`;

    card.innerHTML = headerHtml;
    card.appendChild(interactiveWrapper);
    container.appendChild(card);

    // Setup the search-combobox or selected capsule view
    updateCategoryView(cat.id);
  });
}

// Update either Combobox Search or Capsule view for a specific category
function updateCategoryView(catId) {
  const wrapper = document.getElementById(`cat-interactive-${catId}`);
  const card = document.getElementById(`cat-card-${catId}`);
  const votedId = userVotes[catId];

  if (votedId) {
    // Show Capsule (Selected student)
    card.classList.add('has-vote');
    const votedStudent = allStudents.find(s => s.id === votedId);
    const displayName = votedStudent ? votedStudent.fullName : 'Άγνωστος/η';
    const displayClass = votedStudent ? votedStudent.class : '';

    wrapper.innerHTML = `
      <div class="capsule-selection">
        <div class="capsule-label">
          <span>🌟</span>
          <span>${displayName}</span>
          <span class="capsule-class">${displayClass}</span>
        </div>
        <button type="button" class="capsule-clear" onclick="clearVote('${catId}')" title="Αφαίρεση ψήφου">✕</button>
      </div>
    `;
  } else {
    // Show Combobox Search Box
    card.classList.remove('has-vote');
    
    // Create unique ID for input and list
    const inputId = `combo-input-${catId}`;
    const dropdownId = `combo-dropdown-${catId}`;

    wrapper.innerHTML = `
      <div class="combobox-container" id="combo-container-${catId}">
        <div class="combobox-search-wrapper">
          <input type="text" id="${inputId}" class="combobox-input" placeholder="Αναζήτηση συμμαθητή..." onfocus="openCombobox('${catId}')" oninput="filterCombobox('${catId}')" autocomplete="off">
          <span class="combobox-chevron">▼</span>
        </div>
        <div class="combobox-dropdown" id="${dropdownId}">
          <!-- Grouped options loaded dynamically -->
        </div>
      </div>
    `;
    
    populateComboboxDropdown(catId, '');
  }
}

// Populate the options in the combobox, optionally filtered by a query string
function populateComboboxDropdown(catId, queryText) {
  const dropdown = document.getElementById(`combo-dropdown-${catId}`);
  if (!dropdown) return;

  const query = normalize(queryText.trim());
  
  // Filter students based on query
  const filteredStudents = allStudents.filter(s => {
    if (!query) return true;
    return normalize(s.fullName).includes(query) || normalize(s.class).includes(query);
  });

  if (filteredStudents.length === 0) {
    dropdown.innerHTML = `<div class="combobox-no-results">Δεν βρέθηκαν αποτελέσματα</div>`;
    return;
  }

  // Group filtered students by Class (Τμήμα)
  const groups = {};
  filteredStudents.forEach(s => {
    if (!groups[s.class]) {
      groups[s.class] = [];
    }
    groups[s.class].push(s);
  });

  // Sort classes ascending
  const classes = Object.keys(groups).sort();

  let dropdownHtml = '';
  classes.forEach(cls => {
    dropdownHtml += `<div class="combobox-group-header">ΤΜΗΜΑ ${cls}</div>`;
    
    // Sort students inside class alphabetically
    const classStudents = groups[cls].sort((a, b) => a.fullName.localeCompare(b.fullName, 'el'));
    
    classStudents.forEach(student => {
      dropdownHtml += `
        <div class="combobox-option" onclick="selectVote('${catId}', '${student.id}')">
          ${student.fullName}
        </div>
      `;
    });
  });

  dropdown.innerHTML = dropdownHtml;
}

// Global functions exposed to window for onclick handlers
window.openCombobox = function(catId) {
  // Close all other comboboxes first
  document.querySelectorAll('.combobox-container').forEach(c => {
    if (c.id !== `combo-container-${catId}`) {
      c.classList.remove('open');
    }
  });

  const container = document.getElementById(`combo-container-${catId}`);
  if (container) {
    container.classList.add('open');
  }
};

window.filterCombobox = function(catId) {
  const input = document.getElementById(`combo-input-${catId}`);
  if (input) {
    populateComboboxDropdown(catId, input.value);
  }
};

window.selectVote = function(catId, studentId) {
  userVotes[catId] = studentId;
  updateCategoryView(catId);
  updateVotingProgress();
  
  // Also show quick confirmation
  const votedStudent = allStudents.find(s => s.id === studentId);
  showToast(`Επιλέχθηκε: ${votedStudent.fullName} για την κατηγορία!`, 'success');
};

window.clearVote = function(catId) {
  delete userVotes[catId];
  updateCategoryView(catId);
  updateVotingProgress();
};

function updateVotingProgress() {
  const voteCount = Object.keys(userVotes).length;
  const statusMsg = document.getElementById('voting-status-msg');
  statusMsg.innerHTML = `Έχετε επιλέξει <strong>${voteCount}</strong> από τις <strong>20</strong> κατηγορίες`;
}

// -------------------------------------------------------------
// RENDER RESULTS INTERFACE (LEADERBOARD)
// -------------------------------------------------------------
async function loadAndRenderResults() {
  const container = document.getElementById('results-container');
  container.innerHTML = '<div class="loading-spinner">Φόρτωση και υπολογισμός αποτελεσμάτων...</div>';

  try {
    const response = await fetch('/api/results');
    if (!response.ok) throw new Error('Failed to load results');
    
    const data = await response.json();
    
    // Render participation statistics
    document.getElementById('stats-total-voters').textContent = data.totalVoters;
    const participationRate = data.totalStudents > 0 
      ? Math.round((data.totalVoters / data.totalStudents) * 100) 
      : 0;
    document.getElementById('stats-percent-participation').textContent = `${participationRate}%`;

    // Render cards
    container.innerHTML = '';
    
    data.results.forEach(res => {
      const card = document.createElement('div');
      card.className = 'card glass-card results-card';

      let nomineesHtml = '';
      
      if (res.nominees.length === 0) {
        nomineesHtml = `<div class="no-votes-placeholder">Δεν υπάρχουν ακόμη ψήφοι για αυτή την κατηγορία.</div>`;
      } else {
        nomineesHtml = '<div class="results-list">';
        
        // Calculate total votes cast in this category
        const categoryTotalVotes = res.nominees.reduce((sum, n) => sum + n.votes, 0);

        // Show top nominees (e.g. up to 5 nominees to keep it clean)
        const topNominees = res.nominees.slice(0, 5);
        
        topNominees.forEach((nom, index) => {
          const percentage = categoryTotalVotes > 0 
            ? Math.round((nom.votes / categoryTotalVotes) * 100) 
            : 0;
          
          const crownEmoji = index === 0 ? '👑 ' : '';
          
          nomineesHtml += `
            <div class="nominee-row">
              <div class="nominee-info">
                <span class="nominee-name">${crownEmoji}${nom.fullName}<span class="nominee-class">Τμήμα ${nom.class}</span></span>
                <span class="nominee-votes">${nom.votes} ${nom.votes === 1 ? 'ψήφος' : 'ψήφοι'} (${percentage}%)</span>
              </div>
              <div class="nominee-progress-container">
                <div class="nominee-progress-bar" style="width: ${percentage}%"></div>
              </div>
            </div>
          `;
        });

        nomineesHtml += '</div>';
      }

      card.innerHTML = `
        <h3>
          <span>${res.emoji}</span>
          <span>${res.category}</span>
        </h3>
        ${nomineesHtml}
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error('Results render error:', error);
    container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">Αδυναμία φόρτωσης αποτελεσμάτων. Παρακαλώ ελέγξτε τη σύνδεσή σας.</div>';
  }
}
