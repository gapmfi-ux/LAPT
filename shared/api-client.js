// Simple JSONP API Client for Loan Application Tracker
const GAS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
  APP_NAME: 'Loan Application Tracker',
  VERSION: '1.0.0'
};

// Simple JSONP request
function makeJsonpRequest(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    // Build URL
    let url = GAS_CONFIG.WEB_APP_URL + '?action=' + encodeURIComponent(action);
    url += '&callback=' + callbackName;
    
    // Add parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }
    });
    
    // Create script element
    const script = document.createElement('script');
    
    // Define callback
    window[callbackName] = function(data) {
      // Cleanup
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      delete window[callbackName];
      
      // Handle response
      if (data && (data.success !== false)) {
        resolve(data);
      } else {
        const errorMsg = data ? (data.message || data.error || 'Request failed') : 'No response';
        reject(new Error(errorMsg));
      }
    };
    
    // Error handling
    script.onerror = function() {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      delete window[callbackName];
      reject(new Error('Failed to load script'));
    };
    
    // Add to page
    script.src = url;
    document.body.appendChild(script);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (window[callbackName]) {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
        reject(new Error('Request timeout'));
      }
    }, 10000);
  });
}

// API Methods
const gasAPI = {
  authenticateUser: function(userName) {
    return makeJsonpRequest('authenticate', { userName: userName });
  },
  
  getNewApplications: function() {
    return makeJsonpRequest('getNewApplications');
  },
  
  getPendingApplications: function() {
    return makeJsonpRequest('getPendingApplications');
  },
  
  getPendingApprovalApplications: function() {
    return makeJsonpRequest('getPendingApprovalApplications');
  },
  
  getApprovedApplications: function() {
    return makeJsonpRequest('getApprovedApplications');
  },
  
  getAllApplicationCounts: function() {
    return makeJsonpRequest('getAllApplicationCounts');
  },
  
  getAllUsers: function() {
    return makeJsonpRequest('getAllUsers');
  },
  
  // Test if API is working
  testConnection: function() {
    return makeJsonpRequest('getAllApplicationCounts')
      .then(() => ({ connected: true, message: 'API is working' }))
      .catch(error => ({ connected: false, message: error.message }));
  }
};

// Global state
let APP_STATE = {
  user: null,
  permissions: null,
  currentSection: 'new'
};

// Helper functions
function getConfig() {
  return GAS_CONFIG;
}

function getAppState() {
  return APP_STATE;
}

function updateAppState(key, value) {
  APP_STATE[key] = value;
  if (['user', 'permissions'].includes(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function loadAppState() {
  const user = localStorage.getItem('user');
  const permissions = localStorage.getItem('permissions');
  if (user) APP_STATE.user = JSON.parse(user);
  if (permissions) APP_STATE.permissions = JSON.parse(permissions);
}

// Initialize
loadAppState();

// Make available globally
window.gasAPI = gasAPI;
window.getConfig = getConfig;
window.getAppState = getAppState;
window.updateAppState = updateAppState;
