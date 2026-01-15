// Applications Tables JS
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

async function loadApplicationsData(sectionId) {
    let apiFunction;
    let tableId;
    
    switch(sectionId) {
        case 'new':
            apiFunction = 'getNewApplications';
            tableId = 'new-list';
            break;
        case 'pending':
            apiFunction = 'getPendingApplications';
            tableId = 'pending-list';
            break;
        case 'pending-approvals':
            apiFunction = 'getPendingApprovalApplications';
            tableId = 'pending-approvals-list';
            break;
        case 'approved':
            apiFunction = 'getApprovedApplications';
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
        let applications;
        
        switch(apiFunction) {
            case 'getNewApplications':
                applications = await gasAPI.getNewApplications();
                break;
            case 'getPendingApplications':
                applications = await gasAPI.getPendingApplications();
                break;
            case 'getPendingApprovalApplications':
                applications = await gasAPI.getPendingApprovalApplications();
                break;
            case 'getApprovedApplications':
                applications = await gasAPI.getApprovedApplications();
                break;
        }
        
        // Store data
        applicationsData[sectionId] = applications || [];
        
        // Render table
        renderApplicationsTable(tableId, applications);
        
    } catch (error) {
        console.error(`Error loading ${sectionId} applications:`, error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="error">
                    <i class="fas fa-exclamation-triangle"></i> Error loading applications: ${error.message}
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
    
    tbody.innerHTML = applications.map(app => `
        <tr>
            <td class="app-number">
                <a href="javascript:void(0)" class="app-number-link" onclick="handleAppNumberClick('${escapeHtml(app.appNumber)}')">
                    <i class="fas fa-file-invoice"></i> ${escapeHtml(app.appNumber || 'N/A')}
                </a>
            </td>
            <td class="applicant-name">${escapeHtml(app.applicantName || app.name || 'N/A')}</td>
            <td class="amount">${format.currency(app.amount)}</td>
            <td class="date">${format.date(app.date)}</td>
            <td class="action-by">${escapeHtml(app.actionBy || 'N/A')}</td>
        </tr>
    `).join('');
}

function setupEventListeners() {
    // Setup click handlers for app numbers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('app-number-link')) {
            const appNumber = e.target.textContent.trim().replace(/^[^A-Za-z0-9]*/, '');
            handleAppNumberClick(appNumber);
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
    showSuccessModal('Applications list refreshed');
}

function showApplicationPreview(appData) {
    const previewHtml = `
        <div class="app-preview" id="app-preview">
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
                            <span class="preview-value app-number-value">${escapeHtml(appData.appNumber)}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Applicant Name:</span>
                            <span class="preview-value">${escapeHtml(appData.applicantName || appData.name || 'N/A')}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Amount:</span>
                            <span class="preview-value amount-value">${format.currency(appData.amount)}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Date:</span>
                            <span class="preview-value">${format.date(appData.date)}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Status:</span>
                            <span class="preview-value status-badge ${getStatusBadgeClass(appData.status)}">
                                ${escapeHtml(appData.status || 'N/A')}
                            </span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Stage:</span>
                            <span class="preview-value">${escapeHtml(appData.stage || 'N/A')}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Action By:</span>
                            <span class="preview-value">${escapeHtml(appData.actionBy || 'N/A')}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Last Updated By:</span>
                            <span class="preview-value">${escapeHtml(appData.lastUpdatedBy || 'N/A')}</span>
                        </div>
                    </div>
                    
                    ${appData.purpose ? `
                    <div class="preview-section">
                        <h4><i class="fas fa-bullseye"></i> Purpose</h4>
                        <p>${escapeHtml(appData.purpose)}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="preview-actions">
                    <button class="btn-secondary" onclick="closeApplicationPreview()">
                        Close
                    </button>
                    <button class="btn-primary" onclick="viewApplicationDetails('${escapeHtml(appData.appNumber)}')">
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

function viewApplicationDetails(appNumber) {
    closeApplicationPreview();
    handleAppNumberClick(appNumber);
}

// Make functions globally available
window.initializeApplicationsSection = initializeApplicationsSection;
window.showSection = showSection;
window.refreshApplications = refreshApplications;
window.handleAppNumberClick = handleAppNumberClick;
window.showApplicationPreview = showApplicationPreview;
window.closeApplicationPreview = closeApplicationPreview;
window.viewApplicationDetails = viewApplicationDetails;
