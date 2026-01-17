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

function callBackendAction(actionName, onSuccess, onFailure) {
  // Prefer google.script.run if available (Apps Script environment)
  if (window.google && google.script && google.script.run) {
    try {
      // Use the typical pattern used previously
      google.script.run
        .withSuccessHandler(onSuccess)
        .withFailureHandler(onFailure)[actionName]();
      return;
    } catch (err) {
      // Fall through to api client fallback
      console.warn('callBackendAction: google.script.run call failed, falling back to appsAPI', err);
    }
  }

  // Fallback: appsAPI / apiService
  const apiClient = window.appsAPI || window.newAppAPI || window.viewAppAPI || window.gasAPI || window.apiService || null;
  if (!apiClient) {
    onFailure(new Error('No API client available'));
    return;
  }

  // If the client has a named method, call it, otherwise use generic request
  if (typeof apiClient[actionName] === 'function') {
    try {
      const res = apiClient[actionName]();
      if (res && typeof res.then === 'function') {
        res.then(onSuccess).catch(onFailure);
      } else {
        // synchronous return
        onSuccess(res);
      }
    } catch (err) {
      onFailure(err);
    }
    return;
  }

  if (typeof apiClient.request === 'function') {
    apiClient.request(actionName)
      .then(onSuccess)
      .catch(onFailure);
    return;
  }

  onFailure(new Error('API client does not support the requested action: ' + actionName));
}

function populateTable(tableId, statusFunctionName, options = {}) {
  const { showLoading = true } = options;
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
    if (!data) rows = [];
    else if (Array.isArray(data)) rows = data;
    else if (data.success && Array.isArray(data.data)) rows = data.data;
    else if (Array.isArray(data.data)) rows = data.data;
    else if (data && typeof data === 'object' && Object.keys(data).length && ('appNumber' in data || 'app_number' in data || 'id' in data)) rows = [data];
    else rows = [];

    const filteredData = rows.filter(row => row && row.appNumber && row.appNumber.toString().trim());

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

      // App number cell with link (attach event listener rather than inline onclick)
      const tdApp = document.createElement('td');
      tdApp.className = 'app-number';
      const a = document.createElement('a');
      a.href = 'javascript:void(0)';
      a.className = 'app-number-link';
      a.textContent = appNumber;
      a.addEventListener('click', function() { handleAppNumberClick(appNumber); });
      tdApp.appendChild(a);
      tr.appendChild(tdApp);

      // Applicant name
      const tdName = document.createElement('td');
      tdName.className = 'applicant-name';
      tdName.textContent = row.applicantName || row.name || 'N/A';
      tr.appendChild(tdName);

      // Amount
      const tdAmount = document.createElement('td');
      tdAmount.className = 'amount';
      try {
        tdAmount.textContent = (typeof format !== 'undefined' && format && typeof format.currency === 'function')
          ? format.currency(row.amount)
          : (row.amount != null ? String(row.amount) : '');
      } catch (e) {
        tdAmount.textContent = row.amount != null ? String(row.amount) : '';
      }
      tr.appendChild(tdAmount);

      // Date
      const tdDate = document.createElement('td');
      tdDate.className = 'date';
      try {
        tdDate.textContent = (typeof format !== 'undefined' && format && typeof format.date === 'function')
          ? format.date(row.date)
          : (row.date ? new Date(row.date).toLocaleDateString() : 'N/A');
      } catch (e) {
        tdDate.textContent = row.date ? String(row.date) : 'N/A';
      }
      tr.appendChild(tdDate);

      // Action by
      const tdActionBy = document.createElement('td');
      tdActionBy.className = 'action-by';
      tdActionBy.textContent = row.actionBy || row.action_by || 'N/A';
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

    // If the table was previously empty, show an error row; otherwise keep existing rows intact.
    if (!tbody.children.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="error">Error loading data: ${error?.message || 'Unknown error'}</td></tr>`;
    } else {
      console.error('Error populating table (background refresh kept existing rows):', error);
      // Optionally: show transient toast / console message
    }
  };

  // Trigger backend call using hybrid transport
  callBackendAction(statusFunctionName, onSuccess, onFailure);
}

// ----------- UPDATED APPLICATION CLICK HANDLER -----------
async function handleAppNumberClick(appNumber) {
  if (!appNumber || appNumber === 'undefined' || appNumber === 'null') {
    alert('Error: Invalid application number');
    return;
  }

  const userName = localStorage.getItem('loggedInName') || '';

  function openEdit(appNum) {
    // Open in edit mode using existing modal function
    if (typeof showNewApplicationModal === 'function') {
      showNewApplicationModal(appNum);
    } else {
      console.warn('showNewApplicationModal not found');
    }
  }

  function openView(appData) {
    if (typeof openViewApplicationModal === 'function') {
      openViewApplicationModal(appData);
    } else {
      // Fallback: show preview using existing preview UI if available
      if (typeof showApplicationPreview === 'function') {
        showApplicationPreview(appData);
      } else {
        alert('Application loaded. (No view modal available)');
      }
    }
  }

  // Show loading if available
  if (typeof showLoading === 'function') showLoading('Loading application...');

  const onSuccess = function(response) {
    if (typeof hideLoading === 'function') hideLoading();

    // normalize response shape
    let payload = response;
    if (response && response.success && response.data) payload = response.data;

    if (!payload) {
      alert('Failed to load application: No data returned');
      return;
    }

    // If this is a draft (NEW + DRAFT) open the edit modal
    const status = payload.status || payload.Status || '';
    const completionStatus = payload.completionStatus || payload.completion_status || payload.completion || '';
    if (String(status).toUpperCase() === 'NEW' && String(completionStatus).toUpperCase() === 'DRAFT') {
      openEdit(appNumber);
    } else {
      openView(payload);
    }
  };

  const onFailure = function(error) {
    if (typeof hideLoading === 'function') hideLoading();

    if (error?.message?.includes('Application not found')) {
      alert('Application not found: ' + appNumber + '. Please try refreshing the list.');
    } else if (error?.message?.includes('not authorized') || (error && error.message && /auth/i.test(error.message))) {
      alert('You are not authorized to view this application.');
    } else {
      alert('Error loading application details: ' + (error?.message || error));
    }
  };

  // Call backend (prefer google.script.run, fallback to API client)
  callBackendAction('getApplicationDetails', onSuccess, onFailure);

  // If using appsAPI with method signature getApplicationDetails(appNumber, userName) the generic callBackendAction
  // will have invoked appsAPI.getApplicationDetails() without args, so we need to attempt the call with args for API clients:
  // Check and, if necessary, call directly using api client
  const apiClient = window.appsAPI || window.newAppAPI || window.viewAppAPI || window.gasAPI || window.apiService || null;
  if (apiClient) {
    if (typeof apiClient.getApplicationDetails === 'function') {
      try {
        const r = apiClient.getApplicationDetails(appNumber, userName);
        if (r && typeof r.then === 'function') {
          r.then(onSuccess).catch(onFailure);
        } else {
          onSuccess(r);
        }
      } catch (err) {
        // ignore - already attempted generic call
      }
    } else if (typeof apiClient.request === 'function') {
      // explicit request form
      apiClient.request('getApplicationDetails', { appNumber, userName })
        .then(onSuccess)
        .catch(onFailure);
    }
  }
}

// Export convenience functions if needed by other modules
window.populateTable = populateTable;
window.handleAppNumberClick = handleAppNumberClick;
window.getStatusBadgeClass = getStatusBadgeClass;
