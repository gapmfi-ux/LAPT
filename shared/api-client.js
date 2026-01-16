// Simple JSONP API Client for Google Apps Script
const GAS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
  APP_NAME: 'Loan Application Tracker',
  VERSION: '1.0.0'
};

// Simple JSONP request function
function jsonpRequest(action, data = {}) {
  return new Promise((resolve, reject) => {
    // Create unique callback name
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Create script element
    const script = document.createElement('script');
    
    // Build URL with parameters
    let url = GAS_CONFIG.WEB_APP_URL + '?action=' + encodeURIComponent(action);
    url += '&callback=' + callbackName;
    
    // Add data parameters
    if (data && typeof data === 'object') {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
        }
      }
    }
    
    // Add timestamp to prevent caching
    url += '&_=' + Date.now();
    
    // Define callback function
    window[callbackName] = function(response) {
      // Clean up
      delete window[callbackName];
      document.body.removeChild(script);
      
      // Handle response
      if (response && response.success !== false) {
        resolve(response);
      } else {
        const errorMsg = response ? (response.message || response.error || 'Request failed') : 'No response';
        reject(new Error(errorMsg));
      }
    };
    
    // Error handling
    script.onerror = function() {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error('Network error - failed to load script'));
    };
    
    // Set script source and add to page
    script.src = url;
    document.body.appendChild(script);
  });
}

// API Methods
const gasAPI = {
  // Authentication
  authenticateUser: function(userName) {
    return jsonpRequest('authenticate', { userName: userName });
  },
  
  // Application data
  getNewApplications: function() {
    return jsonpRequest('getNewApplications');
  },
  
  getPendingApplications: function() {
    return jsonpRequest('getPendingApplications');
  },
  
  getPendingApprovalApplications: function() {
    return jsonpRequest('getPendingApprovalApplications');
  },
  
  getApprovedApplications: function() {
    return jsonpRequest('getApprovedApplications');
  },
  
  getAllApplicationCounts: function() {
    return jsonpRequest('getAllApplicationCounts');
  },
  
  // User management
  getAllUsers: function() {
    return jsonpRequest('getAllUsers');
  },
  
  addUser: function(userData) {
    // Note: For complex data, we need to stringify
    return jsonpRequest('addUser', { 
      data: JSON.stringify(userData) 
    });
  },
  
  deleteUser: function(userName) {
    return jsonpRequest('deleteUser', { userName: userName });
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
