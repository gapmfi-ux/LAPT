// mock-api.js - lightweight client-side mock for development/testing.
// Provides the minimal methods the UI calls so the UI can show demo data
// while your real API loader / backend is being deployed.
// Remove this file (or the script include) when real APIs are available.

(function() {
  if (window.appsAPI || window.apiService || window.gasAPI) {
    // Real API exists — don't override.
    return;
  }

  console.info('mock-api: injecting local mock APIs for development');

  const nowIsostring = new Date().toISOString();

  const demoApps = [
    { appNumber: 'LA0001', applicantName: 'Demo User', amount: 5000, date: nowIsostring, actionBy: 'Loan Officer', status: 'NEW', stage: 'New', purpose: 'Working capital' },
    { appNumber: 'LA0002', applicantName: 'Alice Example', amount: 12000, date: nowIsostring, actionBy: 'Reviewer', status: 'PENDING', stage: 'Assessment', purpose: 'Expansion' }
  ];

  const mock = {
    getNewApplications: async function() {
      return demoApps.filter(a => a.status === 'NEW');
    },
    getPendingApplications: async function() {
      return demoApps.filter(a => a.status === 'PENDING' || a.status === 'NEW');
    },
    getPendingApprovalApplications: async function() {
      return demoApps.filter(a => a.status === 'PENDING APPROVAL');
    },
    getApprovedApplications: async function() {
      return demoApps.filter(a => a.status === 'APPROVED');
    },
    getAllApplicationCounts: async function() {
      return { new: demoApps.filter(a => a.status === 'NEW').length, pending: demoApps.filter(a => a.status === 'PENDING').length, pendingApprovals: 0, approved: 0 };
    },
    getApplicationDetails: async function(appNumber) {
      const found = demoApps.find(a => String(a.appNumber) === String(appNumber));
      if (found) {
        return {
          success: true,
          data: Object.assign({}, found, {
            loanHistory: [],
            personalBudget: [],
            monthlyTurnover: {},
            documents: {}
          })
        };
      } else {
        return { success: false, message: 'Not found' };
      }
    },
    getNewApplicationContext: async function() {
      const n = 'LA' + String(Math.floor(Math.random() * 9000) + 1000);
      return { appNumber: n, folderId: 'mock-folder-' + n };
    },
    saveProcessApplicationForm: async function(appNumber, formData, userName, isDraft) {
      console.log('mock saveProcessApplicationForm', appNumber, formData, userName, isDraft);
      return { success: true, message: isDraft ? 'Draft saved (mock)' : 'Application submitted (mock)' };
    },
    submitApplicationComment: async function(requestData, userName) {
      console.log('mock submitApplicationComment', requestData, userName);
      return { success: true, message: 'Comment saved (mock)' };
    },
    revertApplicationStage: async function(appNumber, targetStage, userName) {
      console.log('mock revertApplicationStage', appNumber, targetStage, userName);
      return { success: true, message: 'Reverted (mock)' };
    }
  };

  // Expose as appsAPI and common aliases (Main.js checks many names)
  window.appsAPI = mock;
  window.newAppAPI = mock;
  window.viewAppAPI = mock;
  window.apiService = {
    // minimal request wrapper used by ApiService style code
    request: async function(action, params) {
      if (typeof mock[action] === 'function') {
        const result = await mock[action](...(params && params._args ? params._args : []));
        // normalize some methods to { success:true, data: ... } if array/object returned
        if (Array.isArray(result)) return { success: true, data: result };
        if (result && result.success) return result;
        return { success: true, data: result };
      }
      return { success: false, message: 'mock-api: action not implemented: ' + action };
    },
    getAllApplicationCounts: mock.getAllApplicationCounts,
    testConnection: async function() { return { connected: true, message: 'mock connected' }; },
    clearCache: function() {}
  };

})();
