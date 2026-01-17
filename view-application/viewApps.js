// viewApps.js — updated to support both Google Apps Script (google.script.run)
// and the web API client (window.viewAppAPI / window.appsAPI / window.apiService).
// Falls back gracefully and normalizes responses.

console.log('viewApps.js loaded (dual API support)');

let currentAppData = null;

// Generic call helper: tries structured API methods, then .request, then google.script.run
function callApiMethod(methodName, params = {}) {
  return new Promise((resolve, reject) => {
    // Prefer high-level API objects
    const apiClient = window.viewAppAPI || window.newAppAPI || window.appsAPI || window.gasAPI || window.apiService || null;

    // 1) If the client exposes the method directly
    if (apiClient && typeof apiClient[methodName] === 'function') {
      try {
        const result = apiClient[methodName](...(params && params._args ? params._args : Object.values(params)));
        // method may return a promise
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
        return;
      } catch (err) {
        reject(err);
        return;
      }
    }

    // 2) If the client supports generic request(action, params)
    if (apiClient && typeof apiClient.request === 'function') {
      apiClient.request(methodName, params)
        .then(resolve)
        .catch(reject);
      return;
    }

    // 3) If running inside Google Apps Script webapp using google.script.run
    if (window.google && google.script && google.script.run) {
      // google.script.run doesn't return a Promise — wrap callbacks
      try {
        google.script.run
          .withSuccessHandler(function(response) {
            resolve(response);
          })
          .withFailureHandler(function(error) {
            reject(error);
          })[methodName](...(params && params._args ? params._args : Object.values(params)));
        return;
      } catch (err) {
        reject(err);
        return;
      }
    }

    // No API available
    reject(new Error('No API client available (viewApps)'));
  });
}

/* Helper: set status badge */
function setStatusBadge(statusRaw, stageRaw) {
  const badge = document.getElementById('applicationStatusBadge');
  if (!badge) return;
  const status = (statusRaw || '').toString().trim().toUpperCase();
  const stage = stageRaw || '';
  let text = status || stage || 'NEW';
  let bg = '#eef2ff'; // default light
  let color = '#1f2937';

  switch (status) {
    case 'NEW':
    case '':
      bg = '#f3f4f6'; color = '#111827'; text = `NEW`;
      break;
    case 'PENDING':
      bg = '#fff7ed'; color = '#92400e'; text = `PENDING`;
      break;
    case 'PENDING APPROVAL':
      bg = '#e6f0ff'; color = '#0546a0'; text = `PENDING APPROVAL`;
      break;
    case 'APPROVED':
      bg = '#ecfdf5'; color = '#065f46'; text = `APPROVED`;
      break;
    case 'REVERTED':
    case 'REVERT':
      bg = '#ffebef'; color = '#9b1c1c'; text = `REVERTED`;
      break;
    default:
      bg = '#f3f4f6'; color = '#111827'; text = status || stage || 'N/A';
      break;
  }

  badge.textContent = text;
  badge.style.background = bg;
  badge.style.color = color;
  badge.style.border = `1px solid ${shadeColor(bg, -8)}`;
}

function shadeColor(hexColor, percent) {
  try {
    const h = hexColor.replace('#','');
    const num = parseInt(h,16);
    const r = (num >> 16) + percent;
    const g = ((num >> 8) & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    const newR = Math.max(Math.min(255, r), 0);
    const newG = Math.max(Math.min(255, g), 0);
    const newB = Math.max(Math.min(255, b), 0);
    return `rgb(${newR}, ${newG}, ${newB})`;
  } catch (e) {
    return hexColor;
  }
}

// Main: fetch and show application details
async function viewApplication(appNumber) {
  if (!appNumber) {
    console.error('No application number provided');
    return;
  }

  if (typeof showLoading === 'function') showLoading();

  try {
    // Try API
    const user = (window.getCurrentUser && getCurrentUser()) || {};
    const userName = user.userName || user.fullName || '';

    const resp = await callApiMethod('getApplicationDetails', { appNumber, userName });
    // Normalize: API may return {success:true, data: {...}} or direct object
    let appData = null;
    if (!resp) {
      throw new Error('Empty response from API');
    } else if (resp.success && resp.data) {
      appData = resp.data;
    } else if (resp.data) {
      appData = resp.data;
    } else if (resp.appNumber || resp.appNumber === 0) {
      appData = resp;
    } else {
      // If the API returned a wrapper with other shape, attempt to use resp.response.data etc
      appData = resp;
    }

    if (typeof hideLoading === 'function') hideLoading();
    initViewApplicationModal(appData);
  } catch (err) {
    if (typeof hideLoading === 'function') hideLoading();
    console.error('Error fetching application via API:', err);

    // Last resort: try google.script.run if available (covered by callApiMethod fallback)
    // but if callApiMethod already failed, show user-friendly message
    alert('Failed to load application details. ' + (err.message || ''));
  }
}

function initViewApplicationModal(appData) {
  if (!appData) {
    console.error('No application data provided to initViewApplicationModal');
    return;
  }

  currentAppData = appData || {};
  const appNumber = appData.appNumber || 'N/A';
  const applicantName = appData.applicantName || appData.name || 'N/A';

  safeSetText('applicationNumber', appNumber);
  safeSetText('applicationApplicantName', applicantName);

  setStatusBadge(appData.status, appData.stage);

  const printBtn = document.getElementById('btn-print');
  if (printBtn) {
    if ((appData.status || '').toString().trim().toUpperCase() === 'APPROVED') printBtn.style.display = 'inline-block';
    else printBtn.style.display = 'none';
  }

  safeSetText('view-name', applicantName);
  safeSetText('view-amount', formatCurrency(appData.amount));
  safeSetText('view-purpose', appData.purpose || 'N/A');
  safeSetText('view-duration', appData.duration ? `${appData.duration} months` : 'N/A');
  safeSetText('view-interestRate', appData.interestRate ? `${appData.interestRate}%` : 'N/A');

  safeSetText('view-characterComment', appData.characterComment || 'No character assessment provided.');

  populateLoanHistoryReview(appData.loanHistory || []);
  populatePersonalBudgetReview(appData.personalBudget || []);
  populateMonthlyTurnoverReview(appData.monthlyTurnover || {});
  safeSetText('view-netIncome', formatCurrency(appData.netIncome));
  safeSetText('view-repaymentAmount', formatCurrency(appData.repaymentAmount));
  safeSetText('view-debtServiceRatio', appData.debtServiceRatio || 'N/A');

  safeSetText('view-marginComment', appData.marginComment || 'No comment');
  safeSetText('view-repaymentComment', appData.repaymentComment || 'No comment');
  safeSetText('view-securityComment', appData.securityComment || 'No comment');
  safeSetText('view-financialsComment', appData.financialsComment || 'No comment');
  safeSetText('view-risksComment', appData.risksComment || 'No comment');
  safeSetText('view-riskMitigationComment', appData.riskMitigationComment || 'No comment');
  safeSetText('view-creditOfficerComment', appData.creditOfficerComment || 'No recommendation');

  safeSetText('view-details-creditOfficerComment', appData.creditOfficerComment || 'No recommendation');
  safeSetText('view-details-amlroComments', appData.amlroComments || 'No comments');
  safeSetText('view-details-headOfCredit', appData.headOfCredit || 'No recommendation');
  safeSetText('view-details-branchManager', appData.branchManager || 'No recommendation');
  safeSetText('view-details-approver1Comments', appData.approver1Comments || 'No comments');

  safeSetValue('view-details-creditOfficerComment-textarea', appData.creditOfficerComment || '');
  safeSetValue('view-details-amlroComments-textarea', appData.amlroComments || '');
  safeSetValue('view-details-headOfCredit-textarea', appData.headOfCredit || '');
  safeSetValue('view-details-branchManager-textarea', appData.branchManager || '');
  safeSetValue('view-details-approver1Comments-textarea', appData.approver1Comments || '');

  safeSetText('signature-creditOfficer-name', appData.creditOfficerName || appData.creditOfficer || '');
  safeSetText('signature-headOfCredit-name', appData.headOfCreditName || appData.headOfCredit || '');
  safeSetText('signature-branchManager-name', appData.branchManagerName || appData.branchManager || '');

  updateDocumentButtonsForReview(appData.documents || {});

  const userRole = (localStorage.getItem('userRole') || '').toString();
  showRelevantCommentEditors(userRole, appData.stage || 'New');

  updateModalUIForStage(appData);

  const modal = document.getElementById('viewApplicationModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeViewApplicationModal() {
  const modal = document.getElementById('viewApplicationModal');
  if (modal) {
    modal.style.display = 'none';
  }
  try { document.body.style.overflow = ''; } catch (e) {}
}

function openEditSection(tabName) {
  try {
    if (!currentAppData || !currentAppData.appNumber) {
      alert('Application not loaded.');
      return;
    }

    closeViewApplicationModal();

    sessionStorage.setItem('editTab', tabName || 'tab1');

    // If the platform has an API-enabled newApplication modal, call it with the appNumber
    if (typeof showNewApplicationModal === 'function') {
      // Prefer API-aware invocation (function signature may accept appNumber)
      try {
        showNewApplicationModal(currentAppData.appNumber);
      } catch (e) {
        // fallback to generic
        window.showNewApplicationModal && window.showNewApplicationModal(currentAppData.appNumber);
      }
    } else {
      // no new application modal available
      console.warn('No showNewApplicationModal function available to open edit section.');
    }
  } catch (e) {
    console.error('Error opening edit section:', e);
  }
}

// saveStageComment updated to use callApiMethod
async function saveStageComment(isRevert, explicitAction) {
  if (!currentAppData || !currentAppData.appNumber) {
    alert('Application data not available.');
    return;
  }
  const appNumber = currentAppData.appNumber;
  const comment = (document.getElementById('stageComment') || {}).value || '';
  const userName = localStorage.getItem('loggedInName') || '';
  const userRole = localStorage.getItem('userRole') || '';

  if (typeof showLoading === 'function') showLoading();

  try {
    if (isRevert || explicitAction === 'REVERT') {
      const targetStage = prompt('Enter stage to revert to (New, Assessment, Compliance, Ist Review, 2nd Review):');
      if (!targetStage) {
        if (typeof hideLoading === 'function') hideLoading();
        return;
      }

      const resp = await callApiMethod('revertApplicationStage', { appNumber, targetStage, userName });
      if (typeof hideLoading === 'function') hideLoading();

      if (resp && (resp.success || resp === true)) {
        alert(resp.message || 'Application reverted successfully');
        closeViewApplicationModal();
        if (typeof refreshApplications === 'function') refreshApplications();
      } else {
        alert('Error: ' + (resp && resp.message ? resp.message : 'Unknown error'));
      }
      return;
    }

    const action = explicitAction === 'APPROVE' ? 'APPROVE' : 'SUBMIT';

    const commentsData = {
      creditOfficerComment: document.getElementById('view-details-creditOfficerComment-textarea')?.value || '',
      amlroComments: document.getElementById('view-details-amlroComments-textarea')?.value || '',
      headOfCredit: document.getElementById('view-details-headOfCredit-textarea')?.value || '',
      branchManager: document.getElementById('view-details-branchManager-textarea')?.value || '',
      approver1Comments: document.getElementById('view-details-approver1Comments-textarea')?.value || '',
      role: userRole,
      stage: currentAppData.stage || ''
    };

    const payload = {
      appNumber: appNumber,
      comment: comment,
      action: action,
      comments: commentsData
    };

    const resp = await callApiMethod('submitApplicationComment', payload, {});

    if (typeof hideLoading === 'function') hideLoading();

    if (resp && (resp.success || resp === true)) {
      alert(resp.message || 'Action completed successfully');
      closeViewApplicationModal();
      if (typeof refreshApplications === 'function') refreshApplications();
    } else {
      alert('Error: ' + (resp && resp.message ? resp.message : 'Unknown error'));
    }
  } catch (err) {
    if (typeof hideLoading === 'function') hideLoading();
    console.error('Error saving stage comment:', err);
    alert('Error: ' + (err && err.message ? err.message : err));
  }
}

/* -------------------------
   Helper functions (kept from original file)
   ------------------------- */

function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value === null || value === undefined) {
    el.textContent = '';
    return;
  }
  const normalized = value.toString().replace(/\r\n/g, '\n');
  el.textContent = normalized;
}
function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
function formatCurrency(value) {
  if (value === null || value === undefined) return '0.00';
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function escapeHtml(s) {
  if (!s) return '';
  return s.toString().replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
  });
}

/* Reuse the existing DOM helper functions used by the view modal.
   The original file's functions such as populateLoanHistoryReview,
   populatePersonalBudgetReview, populateMonthlyTurnoverReview,
   updateDocumentButtonsForReview, showRelevantCommentEditors, updateModalUIForStage
   are expected to be present in the same scope (unchanged). */

window.viewApplication = viewApplication;
window.initViewApplicationModal = initViewApplicationModal;
window.closeViewApplicationModal = closeViewApplicationModal;
window.openEditSection = openEditSection;
window.saveStageComment = saveStageComment;
window.openDocument = function(docType) {
  if (!currentAppData || !currentAppData.documents) {
    alert('Document data not available');
    return;
  }
  const docUrl = currentAppData.documents[docType];
  if (docUrl && docUrl.trim() !== '') {
    window.open(docUrl, '_blank');
  } else {
    alert('Document not found or URL not available');
  }
};
