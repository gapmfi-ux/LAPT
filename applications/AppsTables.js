// Applications Tables JS (resilient API calls & robust data normalization)

let currentSection = 'new';
let applicationsData = {
    new: [],
    pending: [],
    pendingApprovals: [],
    approved: []
};

function initializeApplicationsSection(sectionId = 'new') {
    currentSection = sectionId;

    // Show appropriate section
    showSection(sectionId);

    // Load applications data
    loadApplicationsData(sectionId);

    // Setup event listeners
    setupEventListeners();
}

function showSection(sectionId) {
    currentSection = sectionId;

    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Load data for the section
    loadApplicationsData(sectionId);
}

/* ---- Helpers: normalize and map backend responses ---- */
function debugLogResponse(sectionId, result) {
    try {
        console.group(`AppsTables: response for "${sectionId}"`);
        console.log('Raw result:', result);
        console.groupEnd();
    } catch (e) {
        console.log('AppsTables: (unable to pretty print response)', result);
    }
}

function extractApplicationsArray(result) {
    // Handles many shapes:
    // - plain array
    // - { success: true, data: [...] }
    // - { data: { items: [...] } } or data.rows, data.items, data.applications
    // - { result: { data: [...] } }
    // - single object representing one application

    if (!result) return [];

    if (Array.isArray(result)) return result;

    if (result.success && Array.isArray(result.data)) return result.data;

    if (Array.isArray(result.data)) return result.data;

    // Some backends return nested containers
    if (result.data && typeof result.data === 'object') {
        const possibleArrays = ['items', 'rows', 'applications', 'values', 'data'];
        for (const k of possibleArrays) {
            if (Array.isArray(result.data[k])) return result.data[k];
        }
        // maybe data itself holds an object where each key is an app (unlikely) — skip
    }

    if (result.result && Array.isArray(result.result.data)) return result.result.data;
    if (result.result && Array.isArray(result.result)) return result.result;

    // If object looks like a single application (has any app-like key) return single-element array
    if (typeof result === 'object') {
        // detect common fields that indicate an application object
        const keys = Object.keys(result).map(k => k.toLowerCase());
        const appIndicators = ['appnumber', 'app_number', 'appnum', 'name', 'applicant', 'amount'];
        if (appIndicators.some(i => keys.includes(i))) {
            return [result];
        }
    }

    return [];
}

function pickField(obj, candidates = []) {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const c of candidates) {
        // exact
        if (c in obj) return obj[c];
        // case-insensitive
        const matchKey = Object.keys(obj).find(k => k.toLowerCase() === c.toLowerCase());
        if (matchKey) return obj[matchKey];
    }
    return undefined;
}

function normalizeApplication(raw) {
    if (!raw || typeof raw !== 'object') return null;

    // canonical fields we want
    const app = {};

    app.appNumber = pickField(raw, ['appNumber', 'app_number', 'ApplicationNumber', 'applicationNumber', 'appNo', 'app']);
    app.applicantName = pickField(raw, ['applicantName', 'name', 'applicant', 'applicant_name']);
    app.name = app.applicantName || pickField(raw, ['name', 'applicantName']);
    app.amount = pickField(raw, ['amount', 'loanAmount', 'loan_amount', 'Amount']);
    app.date = pickField(raw, ['date', 'createdAt', 'created_at', 'Date']);
    app.actionBy = pickField(raw, ['actionBy', 'action_by', 'actionByName', 'actionByUser']);
    app.status = pickField(raw, ['status', 'Status', 'applicationStatus']);
    app.stage = pickField(raw, ['stage', 'Stage']);
    app.lastUpdatedBy = pickField(raw, ['lastUpdatedBy', 'last_updated_by', 'lastUpdated']);
    app.purpose = pickField(raw, ['purpose', 'Purpose']);

    // If amount is nested (e.g., inside data.amount.value)
    if ((app.amount === undefined || app.amount === null) && raw.amount && typeof raw.amount === 'object') {
        const v = pickField(raw.amount, ['value', 'amount']);
        if (v !== undefined) app.amount = v;
    }

    // Final fallbacks
    if (!app.appNumber) {
        // try other likely keys
        app.appNumber = pickField(raw, ['id', 'Id', 'applicationId', 'application_number']);
    }

    // If still missing appNumber, create a placeholder using name+timestamp so UI won't break
    if (!app.appNumber) {
        app.appNumber = (app.applicantName ? String(app.applicantName).slice(0, 12) : 'APP') + '-' + (Math.random().toString(36).slice(2, 8));
        console.warn('AppsTables: generated fallback appNumber for record', app);
    }

    return app;
}

/* ---- Main data loader ---- */
async function loadApplicationsData(sectionId) {
    let tableId;

    switch(sectionId) {
        case 'new':
            tableId = 'new-list';
            break;
        case 'pending':
            tableId = 'pending-list';
            break;
        case 'pending-approvals':
            tableId = 'pending-approvals-list';
            break;
        case 'approved':
            tableId = 'approved-list';
            break;
        default:
            return;
    }

    const tbody = document.getElementById(tableId);
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading applications...
            </td>
        </tr>
    `;

    try {
        let result;
        const apiClient = window.appsAPI || window.gasAPI || window.newAppAPI || window.viewAppAPI || window.apiService || null;

        // Preferred direct method calls if available
        if (apiClient) {
            try {
                if (sectionId === 'new' && typeof apiClient.getNewApplications === 'function') {
                    result = await apiClient.getNewApplications();
                } else if (sectionId === 'pending' && typeof apiClient.getPendingApplications === 'function') {
                    result = await apiClient.getPendingApplications();
                } else if (sectionId === 'pending-approvals' && typeof apiClient.getPendingApprovalApplications === 'function') {
                    result = await apiClient.getPendingApprovalApplications();
                } else if (sectionId === 'approved' && typeof apiClient.getApprovedApplications === 'function') {
                    result = await apiClient.getApprovedApplications();
                } else if (typeof apiClient.request === 'function') {
                    // Fallback to generic request(action)
                    const actionMap = {
                        new: 'getNewApplications',
                        pending: 'getPendingApplications',
                        'pending-approvals': 'getPendingApprovalApplications',
                        approved: 'getApprovedApplications'
                    };
                    const action = actionMap[sectionId];
                    result = await apiClient.request(action);
                } else {
                    result = [];
                }
            } catch (err) {
                console.warn('API call failed:', err);
                result = [];
            }
        } else {
            // No API available
            console.warn('No API client available - returning empty list for', sectionId);
            result = [];
        }

        // Debug log raw response
        debugLogResponse(sectionId, result);

        // Normalize result to array of raw application objects
        const rawApps = extractApplicationsArray(result);

        // Map and normalize fields for each application
        const applications = rawApps.map(r => {
            const normalized = normalizeApplication(r);
            if (!normalized) {
                // If normalizeApplication fails, still return a minimal object
                return {
                    appNumber: (r && r.appNumber) || JSON.stringify(r).slice(0, 24),
                    applicantName: (r && (r.name || r.applicantName)) || 'N/A',
                    amount: r && (r.amount || r.Amount) || 0,
                    date: r && (r.date || r.Date || r.createdAt) || '',
                    actionBy: r && (r.actionBy || r.action_by) || ''
                };
            }
            return normalized;
        });

        // Store data
        applicationsData[sectionId] = applications;

        // Render table
        renderApplicationsTable(tableId, applications);

    } catch (error) {
        console.error(`Error loading ${sectionId} applications:`, error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="error">
                    <i class="fas fa-exclamation-triangle"></i> Error loading applications: ${error.message || error}
                </td>
            </tr>
        `;
    }
}

function renderApplicationsTable(tableId, applications) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;

    if (!applications || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <i class="fas fa-inbox"></i> No applications found
                </td>
            </tr>
        `;
        return;
    }

    // Ensure escapeHtml and format helpers exist; provide minimal fallbacks
    const escapeHtmlSafe = typeof escapeHtml === 'function' ? escapeHtml : (s) => {
        if (s === undefined || s === null) return '';
        return String(s).replace(/[&<>"'`=\/]/g, function (c) {
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c];
        });
    };
    const formatSafe = typeof format === 'object' && format ? format : {
        currency: (v) => v == null ? '' : (Number(v).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })),
        date: (d) => {
            if (!d) return '';
            try {
                const dd = new Date(d);
                return isNaN(dd.getTime()) ? String(d) : dd.toLocaleDateString();
            } catch (e) { return String(d); }
        }
    };

    tbody.innerHTML = applications.map(app => `
        <tr>
            <td class="app-number">
                <a href="javascript:void(0)" class="app-number-link" onclick="handleAppNumberClick('${escapeHtmlSafe(app.appNumber || '')}')">
                    <i class="fas fa-file-invoice"></i> ${escapeHtmlSafe(app.appNumber || 'N/A')}
                </a>
            </td>
            <td class="applicant-name">${escapeHtmlSafe(app.applicantName || app.name || 'N/A')}</td>
            <td class="amount">${formatSafe.currency(app.amount)}</td>
            <td class="date">${formatSafe.date(app.date)}</td>
            <td class="action-by">${escapeHtmlSafe(app.actionBy || 'N/A')}</td>
        </tr>
    `).join('');
}

function setupEventListeners() {
    // Setup click handlers for app numbers (delegated)
    document.addEventListener('click', function(e) {
        const el = e.target.closest && e.target.closest('.app-number-link');
        if (el) {
            const appNumber = el.getAttribute('onclick') ? (el.getAttribute('onclick').match(/handleAppNumberClick\('([^']+)'\)/) || [null, el.textContent.trim()])[1] : el.textContent.trim();
            if (appNumber) handleAppNumberClick(appNumber);
        }
    });

    // Setup keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            refreshApplications();
        }
    });
}

function refreshApplications() {
    loadApplicationsData(currentSection);

    // Also refresh badge counts
    if (typeof updateBadgeCounts === 'function') {
        updateBadgeCounts();
    }

    // Show success message
    if (typeof showSuccessModal === 'function') {
        showSuccessModal('Applications list refreshed');
    }
}

function showApplicationPreview(appData) {
    const escapeHtmlSafe = typeof escapeHtml === 'function' ? escapeHtml : (s) => s == null ? '' : String(s).replace(/[&<>"'`=\/]/g, function (c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c];
    });
    const formatSafe = typeof format === 'object' && format ? format : {
        currency: (v) => v == null ? '' : (Number(v).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })),
        date: (d) => {
            if (!d) return '';
            try {
                const dd = new Date(d);
                return isNaN(dd.getTime()) ? String(d) : dd.toLocaleDateString();
            } catch (e) { return String(d); }
        }
    };

    const previewHtml = `
        <div class="app-preview" id="app-preview" tabindex="-1" style="display:flex;">
            <div class="preview-card">
                <div class="preview-header">
                    <h3><i class="fas fa-file-alt"></i> Application Preview</h3>
                    <button class="preview-close" onclick="closeApplicationPreview()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="preview-content">
                    <div class="preview-grid">
                        <div class="preview-item">
                            <span class="preview-label">Application Number:</span>
                            <span class="preview-value app-number-value">${escapeHtmlSafe(appData.appNumber || '')}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Applicant Name:</span>
                            <span class="preview-value">${escapeHtmlSafe(appData.applicantName || appData.name || 'N/A')}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Amount:</span>
                            <span class="preview-value amount-value">${formatSafe.currency(appData.amount)}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Date:</span>
                            <span class="preview-value">${formatSafe.date(appData.date)}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Status:</span>
                            <span class="preview-value status-badge ${getStatusBadgeClass(appData.status)}">
                                ${escapeHtmlSafe(appData.status || 'N/A')}
                            </span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Stage:</span>
                            <span class="preview-value">${escapeHtmlSafe(appData.stage || 'N/A')}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Action By:</span>
                            <span class="preview-value">${escapeHtmlSafe(appData.actionBy || 'N/A')}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Last Updated By:</span>
                            <span class="preview-value">${escapeHtmlSafe(appData.lastUpdatedBy || 'N/A')}</span>
                        </div>
                    </div>

                    ${appData.purpose ? `
                    <div class="preview-section">
                        <h4><i class="fas fa-bullseye"></i> Purpose</h4>
                        <p>${escapeHtmlSafe(appData.purpose)}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="preview-actions">
                    <button class="btn-secondary" onclick="closeApplicationPreview()">
                        Close
                    </button>
                    <button class="btn-primary" onclick="viewApplicationDetails('${escapeHtmlSafe(appData.appNumber || '')}')">
                        <i class="fas fa-external-link-alt"></i> View Full Details
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove existing preview if any
    const existingPreview = document.getElementById('app-preview');
    if (existingPreview) {
        existingPreview.remove();
    }

    // Add to document
    document.body.insertAdjacentHTML('beforeend', previewHtml);

    // Show preview
    const preview = document.getElementById('app-preview');
    if (preview) {
        preview.style.display = 'flex';

        // Close on escape key
        preview.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeApplicationPreview();
            }
        });

        // Close on background click
        preview.addEventListener('click', function(e) {
            if (e.target === preview) {
                closeApplicationPreview();
            }
        });

        // Focus on preview
        preview.focus();
    }
}

function closeApplicationPreview() {
    const preview = document.getElementById('app-preview');
    if (preview) {
        preview.remove();
    }
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'DRAFT': 'status-draft',
        'NEW': 'status-new',
        'PENDING': 'status-pending',
        'PENDING APPROVAL': 'status-pending-approval',
        'APPROVED': 'status-approved',
        'COMPLETE': 'status-approved'
    };
    return statusMap[status] || 'status-pending';
}

/**
 * Handle click on an application number link.
 * Tries to use available API (viewAppAPI, gasAPI, appsAPI, apiService) to fetch details.
 * Falls back to a minimal preview if no API is available.
 */
async function handleAppNumberClick(appNumber) {
    try {
        if (!appNumber) return;

        // Prefer higher-level API objects if available
        const api = window.viewAppAPI || window.newAppAPI || window.appsAPI || window.gasAPI || window.apiService || null;

        // If we have a method that returns full details
        if (api && typeof api.getApplicationDetails === 'function') {
            const user = (window.getCurrentUser && getCurrentUser()) || {};
            const userName = user.userName || user.fullName || '';
            const result = await api.getApplicationDetails(appNumber, userName);
            if (result && result.success && result.data) {
                showApplicationPreview(result.data);
            } else if (result && result.appNumber) {
                showApplicationPreview(result);
            } else {
                const msg = (result && result.message) ? result.message : 'Failed to load application details';
                if (typeof showErrorModal === 'function') showErrorModal(msg);
                else console.warn(msg);
            }
            return;
        }

        // Generic ApiService request() fallback
        if (api && typeof api.request === 'function') {
            try {
                const resp = await api.request('getApplicationDetails', { appNumber });
                if (resp && resp.success && resp.data) {
                    showApplicationPreview(resp.data);
                } else if (resp && resp.appNumber) {
                    showApplicationPreview(resp);
                } else {
                    showApplicationPreview({ appNumber });
                }
            } catch (err) {
                console.warn('API request failed:', err);
                showApplicationPreview({ appNumber });
            }
            return;
        }

        // No API available — show minimal preview
        console.warn('No API available to fetch application details. Showing minimal preview.');
        showApplicationPreview({ appNumber });

    } catch (err) {
        console.error('handleAppNumberClick error:', err);
        if (typeof showErrorModal === 'function') showErrorModal(err.message || 'Error opening application');
    }
}

// Make functions globally available
window.initializeApplicationsSection = initializeApplicationsSection;
window.showSection = showSection;
window.refreshApplications = refreshApplications;
window.handleAppNumberClick = handleAppNumberClick;
window.showApplicationPreview = showApplicationPreview;
window.closeApplicationPreview = closeApplicationPreview;
window.viewApplicationDetails = function(appNumber) {
    closeApplicationPreview();
    handleAppNumberClick(appNumber);
};
