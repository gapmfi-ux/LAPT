
// Applications Tables - hybrid backend transport (google.script.run OR appsAPI)
// Restores the user's populateTable semantics and uses google.script.run when available,
// otherwise falls back to the window.appsAPI / window.apiService transport.

'use strict';

// ----------- TABLES & APPLICATION LISTING -----------
// Improved populateTable to support hidden/background refresh (no flicker) and smoother DOM updates.
// Call populateTable(tableId, statusFunctionName, { showLoading: true|false })
function getStatusBadgeClass(status) {
  const statusMap = {
    'DRAFT': 'status-draft',
    'NEW': 'status-new',
    'PENDING': 'status-pending',
    'PENDING APPROVAL': 'status-pending',
    'APPROVED': 'status-approved',
    'COMPLETE': 'status-approved'
  };
  return statusMap[status] || 'status-pending';
}

// FIXED: Improved callBackendAction to properly handle both google.script.run and API client calls
function callBackendAction(actionName, params, onSuccess, onFailure) {
  // Prefer google.script.run if available (Apps Script environment)
  if (window.google && google.script && google.script.run) {
    try {
      let scriptRunner;
      
      // Check if the method exists in google.script.run
      if (typeof google.script.run[actionName] !== 'function') {
        console.warn(`Method ${actionName} not found in google.script.run`);
        throw new Error(`Method ${actionName} not available`);
      }
      
      // Call with parameters if provided
      if (params && Object.keys(params).length > 0) {
        scriptRunner = google.script.run[actionName](params);
      } else {
        scriptRunner = google.script.run[actionName]();
      }
      
      scriptRunner
        .withSuccessHandler(onSuccess)
        .withFailureHandler(onFailure);
      return;
    } catch (err) {
      // Fall through to api client fallback
      console.warn('callBackendAction: google.script.run call failed, falling back to appsAPI', err);
    }
  }

  // Fallback: appsAPI / apiService
  const apiClient = window.appsAPI || window.newAppAPI || window.viewAppAPI || window.apiService || null;
  if (!apiClient) {
    onFailure(new Error('No API client available'));
    return;
  }

  // If the client has a named method, call it with parameters
  if (typeof apiClient[actionName] === 'function') {
    try {
      const result = apiClient[actionName](params);
      if (result && typeof result.then === 'function') {
        result.then(onSuccess).catch(onFailure);
      } else {
        onSuccess(result);
      }
      return;
    } catch (err) {
      console.error(`Error calling ${actionName} on API client:`, err);
      onFailure(err);
      return;
    }
  }

  // Use generic request method
  if (typeof apiClient.request === 'function') {
    apiClient.request(actionName, params || {})
      .then(onSuccess)
      .catch(onFailure);
    return;
  }

  onFailure(new Error(`API client does not support the requested action: ${actionName}`));
}

// FIXED: populateTable function with proper parameters
function populateTable(tableId, statusFunctionName, options = {}) {
  const { showLoading = true, params = {} } = options;
  const tbody = document.querySelector(`#${tableId}`);
  if (!tbody) {
    console.error(`Table body not found: ${tableId}`);
    return;
  }

  // If explicit loading requested (initial/manual), show placeholder.
  if (showLoading) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading applications...</td></tr>`;
  } else {
    // For background refreshes, keep existing rows visible but mark busy for subtle UI hint.
    tbody.setAttribute('aria-busy', 'true');
    tbody.style.opacity = '0.7';
  }

  const onSuccess = function(data) {
    // Clear busy state
    tbody.removeAttribute('aria-busy');
    tbody.style.opacity = '1';

    // Normalize data: many backends return { success, data } or raw array
    let rows = [];
    if (!data) {
      rows = [];
    } else if (Array.isArray(data)) {
      rows = data;
    } else if (data.success && Array.isArray(data.data)) {
      rows = data.data;
    } else if (Array.isArray(data.data)) {
      rows = data.data;
    } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
      rows = data.data;
    } else if (data && typeof data === 'object' && ('appNumber' in data || 'app_number' in data || 'id' in data)) {
      rows = [data];
    } else {
      rows = [];
    }

    const filteredData = rows.filter(row => row && (row.appNumber || row.applicationNumber || row.id));

    // Build rows via DOM to avoid innerHTML flicker
    if (!filteredData.length) {
      // If no data, show a no-data row
      tbody.innerHTML = `<tr><td colspan="5" class="no-data"><i class="fas fa-inbox"></i> No applications found</td></tr>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    filteredData.forEach(row => {
      const appNumber = row.appNumber || row.applicationNumber || row.id || '';
      const tr = document.createElement('tr');

      // App number cell with link
      const tdApp = document.createElement('td');
      tdApp.className = 'app-number';
      const a = document.createElement('a');
      a.href = 'javascript:void(0)';
      a.className = 'app-number-link';
      a.textContent = appNumber;
      a.addEventListener('click', function() { 
        handleAppNumberClick(appNumber); 
      });
      tdApp.appendChild(a);
      tr.appendChild(tdApp);

      // Applicant name
      const tdName = document.createElement('td');
      tdName.className = 'applicant-name';
      tdName.textContent = row.applicantName || row.name || row.applicant_name || 'N/A';
      tr.appendChild(tdName);

      // Amount
      const tdAmount = document.createElement('td');
      tdAmount.className = 'amount';
      try {
        // Check if format utility exists
        if (typeof window.formatCurrency === 'function') {
          tdAmount.textContent = window.formatCurrency(row.amount);
        } else if (row.amount != null) {
          // Simple formatting if no currency formatter available
          tdAmount.textContent = parseFloat(row.amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
          });
        } else {
          tdAmount.textContent = '';
        }
      } catch (e) {
        tdAmount.textContent = row.amount != null ? String(row.amount) : '';
      }
      tr.appendChild(tdAmount);

      // Date
      const tdDate = document.createElement('td');
      tdDate.className = 'date';
      try {
        const dateValue = row.date || row.createdDate || row.created_date;
        if (dateValue) {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            tdDate.textContent = date.toLocaleDateString();
          } else {
            tdDate.textContent = String(dateValue);
          }
        } else {
          tdDate.textContent = 'N/A';
        }
      } catch (e) {
        tdDate.textContent = 'N/A';
      }
      tr.appendChild(tdDate);

      // Action by
      const tdActionBy = document.createElement('td');
      tdActionBy.className = 'action-by';
      tdActionBy.textContent = row.actionBy || row.action_by || row.actionByUser || 'N/A';
      tr.appendChild(tdActionBy);

      fragment.appendChild(tr);
    });

    // Replace children in one operation for smooth update
    tbody.replaceChildren(fragment);
  };

  const onFailure = function(error) {
    // Remove busy state
    tbody.removeAttribute('aria-busy');
    tbody.style.opacity = '1';

    console.error(`Error loading ${statusFunctionName}:`, error);
    
    // If the table was previously empty, show an error row
    if (!tbody.children.length || tbody.children.length === 1) {
      const errorMessage = error?.message || error?.error || 'Unknown error';
      tbody.innerHTML = `<tr><td colspan="5" class="error">
        <i class="fas fa-exclamation-triangle"></i> 
        Error loading data: ${errorMessage}
        <br><small><button onclick="populateTable('${tableId}', '${statusFunctionName}')" class="retry-btn">Retry</button></small>
      </td></tr>`;
    } else {
      // Keep existing data but log error
      console.error('Background refresh failed, keeping existing data:', error);
    }
  };

  // Trigger backend call using hybrid transport with proper parameters
  callBackendAction(statusFunctionName, params, onSuccess, onFailure);
}

// FIXED: Application click handler with proper API integration
async function handleAppNumberClick(appNumber) {
  if (!appNumber || appNumber === 'undefined' || appNumber === 'null') {
    alert('Error: Invalid application number');
    return;
  }

  const userName = localStorage.getItem('loggedInName') || '';
  
  // Show loading indicator
  if (typeof window.showLoading === 'function') {
    window.showLoading('Loading application...');
  }

  const onSuccess = function(response) {
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }

    // Normalize response
    let payload = response;
    if (response && response.success !== false && response.data) {
      payload = response.data;
    } else if (response && response.success === false) {
      alert(`Error: ${response.message || 'Failed to load application'}`);
      return;
    }

    if (!payload) {
      alert('Failed to load application: No data returned');
      return;
    }

    // Determine whether to open in edit or view mode
    const status = payload.status || payload.Status || '';
    const completionStatus = payload.completionStatus || payload.completion_status || payload.completion || '';
    const isDraft = payload.isDraft || payload.is_draft || false;
    
    const statusUpper = String(status).toUpperCase();
    const completionUpper = String(completionStatus).toUpperCase();
    
    if ((statusUpper === 'NEW' && completionUpper === 'DRAFT') || isDraft === true) {
      // Open in edit mode
      if (typeof window.showNewApplicationModal === 'function') {
        window.showNewApplicationModal(appNumber);
      } else {
        alert('Edit mode not available. Opening in view mode.');
        openView(payload);
      }
    } else {
      // Open in view mode
      openView(payload);
    }
  };

  const onFailure = function(error) {
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }

    const errorMsg = error?.message || error?.error || 'Unknown error';
    if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
      alert(`Application ${appNumber} not found. Please refresh the list.`);
    } else if (errorMsg.includes('auth') || errorMsg.includes('unauthorized') || errorMsg.includes('permission')) {
      alert('You are not authorized to view this application.');
    } else {
      alert(`Error loading application: ${errorMsg}`);
    }
  };

  // Try API client first
  const apiClient = window.viewAppAPI || window.appsAPI || window.apiService || window.gasAPI;
  if (apiClient) {
    try {
      if (typeof apiClient.getApplicationDetails === 'function') {
        const result = apiClient.getApplicationDetails(appNumber, userName);
        if (result && typeof result.then === 'function') {
          result.then(onSuccess).catch(onFailure);
        } else {
          onSuccess(result);
        }
        return;
      }
    } catch (err) {
      console.warn('API client call failed, trying alternative methods:', err);
    }
  }

  // Fallback to generic backend call
  callBackendAction('getApplicationDetails', { appNumber, userName }, onSuccess, onFailure);
}

function openView(applicationData) {
  // Check for available view modal functions
  if (typeof window.openViewApplicationModal === 'function') {
    window.openViewApplicationModal(applicationData);
  } else if (typeof window.showApplicationPreview === 'function') {
    window.showApplicationPreview(applicationData);
  } else {
    // Simple fallback display
    alert(`Application Details:\n\nNumber: ${applicationData.appNumber || 'N/A'}\nApplicant: ${applicationData.applicantName || 'N/A'}\nStatus: ${applicationData.status || 'N/A'}`);
  }
}

// Export convenience functions if needed by other modules
window.populateTable = populateTable;
window.handleAppNumberClick = handleAppNumberClick;
window.getStatusBadgeClass = getStatusBadgeClass;
window.callBackendAction = callBackendAction;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('AppsTables.js loaded and ready');
});
