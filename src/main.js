// API Base URL - using relative paths which Vite proxies to http://localhost:3000
const API_BASE = 'http://localhost:3000';

// Global state
let state = {
  researchers: [],
  microscopes: [],
  loans: [],
  joinDetails: [],
  selectedWorkflowLoanId: null
};

// UI Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const apiStatusPill = document.getElementById('api-status-pill');
const apiStatusText = document.getElementById('api-status-text');

// Init
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModals();
  initFilters();
  initWorkflowControls();
  fetchAllData();

  document.getElementById('btn-refresh').addEventListener('click', () => {
    fetchAllData();
    showToast('Refreshed data from server', 'success');
  });
});

// Tab Navigation
function initTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

window.switchTab = function (tabName) {
  tabButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabName));
  tabContents.forEach(c => {
    c.style.display = c.id === `tab-${tabName}` ? 'block' : 'none';
  });

  if (tabName === 'join-details') {
    fetchJoinDetails();
  }
};

// Modals Management
function initModals() {
  document.getElementById('btn-open-create-researcher').addEventListener('click', () => {
    document.getElementById('modal-researcher-title').innerText = 'Add Researcher';
    document.getElementById('researcher-edit-id').value = '';
    document.getElementById('form-researcher').reset();
    openModal('modal-researcher');
  });

  document.getElementById('btn-open-create-microscope').addEventListener('click', () => {
    document.getElementById('modal-microscope-title').innerText = 'Add Microscope';
    document.getElementById('microscope-edit-id').value = '';
    document.getElementById('form-microscope').reset();
    openModal('modal-microscope');
  });

  document.getElementById('btn-open-create-loan').addEventListener('click', () => {
    populateLoanModalDropdowns();
    document.getElementById('form-loan').reset();
    openModal('modal-loan');
  });

  // Form Submits
  document.getElementById('form-researcher').addEventListener('submit', handleResearcherSubmit);
  document.getElementById('form-microscope').addEventListener('submit', handleMicroscopeSubmit);
  document.getElementById('form-loan').addEventListener('submit', handleLoanSubmit);
}

window.openModal = function (id) {
  document.getElementById(id).classList.add('show');
};

window.closeModal = function (id) {
  document.getElementById(id).classList.remove('show');
};

// Toasts
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Fetch All Initial Data
async function fetchAllData() {
  await Promise.all([
    checkWelcomeApi(),
    fetchResearchers(),
    fetchMicroscopes(),
    fetchLoans(),
    fetchJoinDetails()
  ]);
  updateMetrics();
}

// Check Welcome API
async function checkWelcomeApi() {
  try {
    const res = await fetch(`${API_BASE}/`);
    const data = await res.json();
    apiStatusPill.classList.remove('offline');
    apiStatusText.innerText = 'Connected (Port 3000)';
    document.getElementById('welcome-response').innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    apiStatusPill.classList.add('offline');
    apiStatusText.innerText = 'Disconnected - Run npm run server';
    document.getElementById('welcome-response').innerText = `Error connecting to backend API: ${err.message}\nEnsure the server is running on port 3000.`;
  }
}

// ==========================================
// RESEARCHERS
// ==========================================
async function fetchResearchers() {
  try {
    const res = await fetch(`${API_BASE}/researchers`);
    const result = await res.json();
    if (result.success) {
      state.researchers = result.data;
      renderResearchersTable();
    }
  } catch (err) {
    console.error('Failed to fetch researchers:', err);
  }
}

function renderResearchersTable() {
  const tbody = document.getElementById('researchers-table-body');
  if (!state.researchers.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No researchers registered.</td></tr>';
    return;
  }

  tbody.innerHTML = state.researchers.map(r => `
    <tr>
      <td><strong>#${r.id}</strong></td>
      <td>${escapeHtml(r.name)}</td>
      <td><code>${escapeHtml(r.email)}</code></td>
      <td>${escapeHtml(r.department)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editResearcher(${r.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteResearcher(${r.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function handleResearcherSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('researcher-edit-id').value;
  const payload = {
    name: document.getElementById('researcher-name').value.trim(),
    email: document.getElementById('researcher-email').value.trim(),
    department: document.getElementById('researcher-dept').value.trim()
  };

  const url = editId ? `${API_BASE}/researchers/${editId}` : `${API_BASE}/researchers`;
  const method = editId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      closeModal('modal-researcher');
      await fetchResearchers();
      updateMetrics();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Failed to save researcher: ' + err.message, 'error');
  }
}

window.editResearcher = function (id) {
  const r = state.researchers.find(item => item.id === id);
  if (!r) return;
  document.getElementById('modal-researcher-title').innerText = 'Edit Researcher';
  document.getElementById('researcher-edit-id').value = r.id;
  document.getElementById('researcher-name').value = r.name;
  document.getElementById('researcher-email').value = r.email;
  document.getElementById('researcher-dept').value = r.department;
  openModal('modal-researcher');
};

window.deleteResearcher = async function (id) {
  if (!confirm(`Are you sure you want to delete researcher #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/researchers/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      await fetchResearchers();
      updateMetrics();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Error deleting researcher: ' + err.message, 'error');
  }
};

// ==========================================
// MICROSCOPES & SEARCH (Section 6.B)
// ==========================================
async function fetchMicroscopes(type = '', status = '') {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/microscopes${qs}`);
    const result = await res.json();

    if (result.success) {
      state.microscopes = result.data;
      renderMicroscopesTable();
    }
  } catch (err) {
    console.error('Failed to fetch microscopes:', err);
  }
}

function initFilters() {
  document.getElementById('btn-apply-microscope-filters').addEventListener('click', () => {
    const type = document.getElementById('filter-microscope-type').value;
    const status = document.getElementById('filter-microscope-status').value;
    fetchMicroscopes(type, status);
  });

  document.getElementById('btn-reset-microscope-filters').addEventListener('click', () => {
    document.getElementById('filter-microscope-type').value = '';
    document.getElementById('filter-microscope-status').value = '';
    document.getElementById('filter-microscope-search').value = '';
    fetchMicroscopes();
  });

  document.getElementById('filter-microscope-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#microscopes-table-body tr');
    rows.forEach(r => {
      const text = r.innerText.toLowerCase();
      r.style.display = text.includes(term) ? '' : 'none';
    });
  });
}

function renderMicroscopesTable() {
  const tbody = document.getElementById('microscopes-table-body');
  if (!state.microscopes.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No microscopes found matching filter criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = state.microscopes.map(m => `
    <tr>
      <td><strong>#${m.id}</strong></td>
      <td><strong>${escapeHtml(m.name)}</strong></td>
      <td><span class="badge" style="background: rgba(129, 140, 248, 0.15); color: var(--accent);">${escapeHtml(m.type)}</span></td>
      <td>${escapeHtml(m.brand || '—')}</td>
      <td><span class="badge badge-${m.status}">${m.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editMicroscope(${m.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteMicroscope(${m.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function handleMicroscopeSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('microscope-edit-id').value;
  const payload = {
    name: document.getElementById('microscope-name').value.trim(),
    type: document.getElementById('microscope-type').value.trim().toLowerCase(),
    brand: document.getElementById('microscope-brand').value.trim() || null,
    status: document.getElementById('microscope-status').value
  };

  const url = editId ? `${API_BASE}/microscopes/${editId}` : `${API_BASE}/microscopes`;
  const method = editId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      closeModal('modal-microscope');
      await fetchMicroscopes();
      updateMetrics();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Failed to save microscope: ' + err.message, 'error');
  }
}

window.editMicroscope = function (id) {
  const m = state.microscopes.find(item => item.id === id);
  if (!m) return;
  document.getElementById('modal-microscope-title').innerText = 'Edit Microscope';
  document.getElementById('microscope-edit-id').value = m.id;
  document.getElementById('microscope-name').value = m.name;
  document.getElementById('microscope-type').value = m.type;
  document.getElementById('microscope-brand').value = m.brand || '';
  document.getElementById('microscope-status').value = m.status;
  openModal('modal-microscope');
};

window.deleteMicroscope = async function (id) {
  if (!confirm(`Are you sure you want to delete microscope #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/microscopes/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      await fetchMicroscopes();
      updateMetrics();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Error deleting microscope: ' + err.message, 'error');
  }
};

// ==========================================
// LOANS & EQUIPMENT CHECKOUT
// ==========================================
async function fetchLoans() {
  try {
    const res = await fetch(`${API_BASE}/loans`);
    const result = await res.json();
    if (result.success) {
      state.loans = result.data;
      renderLoansTable();
      renderOverviewLoans();
      populateWorkflowDropdown();
    }
  } catch (err) {
    console.error('Failed to fetch loans:', err);
  }
}

function renderOverviewLoans() {
  const tbody = document.getElementById('overview-loans-body');
  if (!state.loans.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No loans recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = state.loans.slice(0, 5).map(l => `
    <tr>
      <td>#${l.id}</td>
      <td>Researcher #${l.researcher_id}</td>
      <td>Microscope #${l.microscope_id}</td>
      <td>${l.loan_date}</td>
      <td><span class="badge badge-${l.status}">${l.status}</span></td>
    </tr>
  `).join('');
}

function renderLoansTable() {
  const tbody = document.getElementById('loans-table-body');
  if (!state.loans.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No loans found.</td></tr>';
    return;
  }

  tbody.innerHTML = state.loans.map(l => {
    let actionBtn = '';
    if (l.status === 'pending') {
      actionBtn = `<button class="btn btn-primary btn-sm" onclick="transitionStatus(${l.id}, 'approved')">Approve →</button>`;
    } else if (l.status === 'approved') {
      actionBtn = `<button class="btn btn-success btn-sm" onclick="transitionStatus(${l.id}, 'done')">Complete (Done) →</button>`;
    } else {
      actionBtn = `<span style="color: var(--text-muted); font-size: 0.8rem;">Finished</span>`;
    }

    return `
      <tr>
        <td><strong>#${l.id}</strong></td>
        <td>Researcher #${l.researcher_id}</td>
        <td>Microscope #${l.microscope_id}</td>
        <td>${l.loan_date}</td>
        <td><span class="badge badge-${l.status}">${l.status}</span></td>
        <td>${actionBtn}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="selectLoanForWorkflow(${l.id})">Simulate</button>
          <button class="btn btn-danger btn-sm" onclick="deleteLoan(${l.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateLoanModalDropdowns() {
  const rSelect = document.getElementById('loan-researcher-select');
  rSelect.innerHTML = '<option value="">Select researcher...</option>' +
    state.researchers.map(r => `<option value="${r.id}">${escapeHtml(r.name)} (${escapeHtml(r.department)})</option>`).join('');

  const mSelect = document.getElementById('loan-microscope-select');
  const availableScopes = state.microscopes.filter(m => m.status === 'available');

  if (availableScopes.length === 0) {
    mSelect.innerHTML = '<option value="">No microscopes currently available</option>';
  } else {
    mSelect.innerHTML = '<option value="">Select available microscope...</option>' +
      availableScopes.map(m => `<option value="${m.id}">${escapeHtml(m.name)} - ${escapeHtml(m.type)} (${escapeHtml(m.brand || 'No brand')})</option>`).join('');
  }
}

async function handleLoanSubmit(e) {
  e.preventDefault();
  const researcher_id = Number(document.getElementById('loan-researcher-select').value);
  const microscope_id = Number(document.getElementById('loan-microscope-select').value);

  if (!researcher_id || !microscope_id) {
    showToast('Please select both a researcher and an available microscope', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ researcher_id, microscope_id })
    });
    const result = await res.json();

    if (result.success) {
      showToast(`Loan #${result.data.id} created with status 'pending' (HTTP 201)`, 'success');
      closeModal('modal-loan');
      await Promise.all([fetchLoans(), fetchMicroscopes(), fetchJoinDetails()]);
      updateMetrics();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Failed to create loan: ' + err.message, 'error');
  }
}

window.deleteLoan = async function (id) {
  if (!confirm(`Are you sure you want to delete loan #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/loans/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      await Promise.all([fetchLoans(), fetchMicroscopes(), fetchJoinDetails()]);
      updateMetrics();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Error deleting loan: ' + err.message, 'error');
  }
};

// ==========================================
// SQL JOIN DETAILS (Section 6.D)
// ==========================================
async function fetchJoinDetails() {
  try {
    const res = await fetch(`${API_BASE}/loans/details`);
    const result = await res.json();
    if (result.success) {
      state.joinDetails = result.data;
      renderJoinDetailsTable();
    }
  } catch (err) {
    console.error('Failed to fetch JOIN details:', err);
  }
}

function renderJoinDetailsTable() {
  const tbody = document.getElementById('join-details-table-body');
  if (!state.joinDetails.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No combined loan records available.</td></tr>';
    return;
  }

  tbody.innerHTML = state.joinDetails.map(d => `
    <tr>
      <td><strong>Loan #${d.loan_id}</strong></td>
      <td><strong>${escapeHtml(d.researcher_name)}</strong> (ID: ${d.researcher_id})</td>
      <td><code>${escapeHtml(d.researcher_email)}</code></td>
      <td><strong>${escapeHtml(d.microscope_name)}</strong> (ID: ${d.microscope_id})</td>
      <td><span class="badge" style="background: rgba(129, 140, 248, 0.15); color: var(--accent);">${escapeHtml(d.microscope_type)}</span></td>
      <td>${d.loan_date}</td>
      <td><span class="badge badge-${d.status}">${d.status}</span></td>
    </tr>
  `).join('');
}

// ==========================================
// WORKFLOW SIMULATOR (Section 7)
// ==========================================
function initWorkflowControls() {
  const select = document.getElementById('workflow-loan-select');
  select.addEventListener('change', (e) => {
    const id = Number(e.target.value);
    selectLoanForWorkflow(id);
  });

  document.getElementById('btn-workflow-approve').addEventListener('click', () => {
    executeStatusPatch('approved');
  });

  document.getElementById('btn-workflow-done').addEventListener('click', () => {
    executeStatusPatch('done');
  });

  document.getElementById('btn-workflow-invalid').addEventListener('click', () => {
    // Attempt invalid transition:
    // If loan is approved, try pending. If pending, try done. If done, try approved.
    const loan = state.loans.find(l => l.id === state.selectedWorkflowLoanId);
    let invalidTarget = 'pending';
    if (loan && loan.status === 'pending') invalidTarget = 'done';
    executeStatusPatch(invalidTarget);
  });
}

function populateWorkflowDropdown() {
  const select = document.getElementById('workflow-loan-select');
  select.innerHTML = '<option value="">Select a loan to test workflow...</option>' +
    state.loans.map(l => `<option value="${l.id}">Loan #${l.id} [Current status: ${l.status}] (Scope #${l.microscope_id})</option>`).join('');

  if (state.selectedWorkflowLoanId) {
    select.value = state.selectedWorkflowLoanId;
    updateWorkflowStepperUI();
  }
}

window.selectLoanForWorkflow = function (id) {
  state.selectedWorkflowLoanId = id;
  document.getElementById('workflow-loan-select').value = id || '';
  updateWorkflowStepperUI();
  switchTab('workflow');
};

function updateWorkflowStepperUI() {
  const loan = state.loans.find(l => l.id === state.selectedWorkflowLoanId);
  const pStep = document.getElementById('step-pending');
  const aStep = document.getElementById('step-approved');
  const dStep = document.getElementById('step-done');

  [pStep, aStep, dStep].forEach(s => {
    s.classList.remove('active', 'completed');
  });

  if (!loan) return;

  if (loan.status === 'pending') {
    pStep.classList.add('active');
  } else if (loan.status === 'approved') {
    pStep.classList.add('completed');
    aStep.classList.add('active');
  } else if (loan.status === 'done') {
    pStep.classList.add('completed');
    aStep.classList.add('completed');
    dStep.classList.add('completed');
  }
}

window.transitionStatus = async function (loanId, newStatus) {
  state.selectedWorkflowLoanId = loanId;
  await executeStatusPatch(newStatus);
};

async function executeStatusPatch(targetStatus) {
  const loanId = state.selectedWorkflowLoanId;
  if (!loanId) {
    showToast('Please select a loan first', 'error');
    return;
  }

  const consoleBox = document.getElementById('workflow-response-console');
  consoleBox.innerText = `Sending PATCH request:\nURL: ${API_BASE}/loans/${loanId}/status\nBody: ${JSON.stringify({ status: targetStatus })}\nWaiting for response...`;

  try {
    const res = await fetch(`${API_BASE}/loans/${loanId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus })
    });

    const result = await res.json();
    consoleBox.innerText = `HTTP Response Status: ${res.status} ${res.statusText}\n\nPayload:\n${JSON.stringify(result, null, 2)}`;

    if (result.success) {
      showToast(`Status updated to '${targetStatus}' (HTTP 200)`, 'success');
      await Promise.all([fetchLoans(), fetchMicroscopes(), fetchJoinDetails()]);
      updateMetrics();
      updateWorkflowStepperUI();
    } else {
      showToast(`HTTP ${res.status}: ${result.message}`, 'error');
    }
  } catch (err) {
    consoleBox.innerText += `\nNetwork Error: ${err.message}`;
    showToast('Request failed: ' + err.message, 'error');
  }
}

// Metrics Counter
function updateMetrics() {
  document.getElementById('metric-researchers').innerText = state.researchers.length;
  document.getElementById('metric-microscopes').innerText = state.microscopes.length;
  document.getElementById('metric-available').innerText = state.microscopes.filter(m => m.status === 'available').length;
  document.getElementById('metric-loans').innerText = state.loans.filter(l => l.status === 'approved' || l.status === 'pending').length;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
