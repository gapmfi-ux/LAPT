// Complete JSONP API Client for Loan Application Tracker
const GAS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
  APP_NAME: 'Loan Application Tracker',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 20,
  NOTIFICATION_CHECK_INTERVAL: 30000,
  AUTO_REFRESH_INTERVAL: 60000,
};

// ===== JSONP REQUEST FUNCTION =====
function makeJsonpRequest(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    // Build URL
    let url = GAS_CONFIG.WEB_APP_URL + '?action=' + encodeURIComponent(action);
    url += '&callback=' + callbackName;
    
    // Add parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        if (typeof params[key] === 'object') {
          url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(params[key]));
        } else {
          url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }
      }
    });
    
    // Add timestamp to prevent caching
    url += '&_=' + Date.now();
    
    // Create script element
    const script = document.createElement('script');
    
    // Define callback function
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
        const errorMsg = data ? (data.message || data.error || 'Request failed') : 'No response from server';
        reject(new Error(errorMsg));
      }
    };
    
    // Error handling
    script.onerror = function() {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      delete window[callbackName];
      reject(new Error('Network error - failed to load script'));
    };
    
    // Add to page
    script.src = url;
    document.body.appendChild(script);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (window[callbackName]) {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
        reject(new Error('Request timeout after 30 seconds'));
      }
    }, 30000);
  });
}

// ===== COMPLETE API METHODS =====
const gasAPI = {
  // ===== AUTHENTICATION & USER FUNCTIONS =====
  authenticateUser: function(userName) {
    return makeJsonpRequest('authenticate', { userName: userName });
  },
  
  getUserPermissions: function(userName) {
    return makeJsonpRequest('getUserPermissions', { userName: userName });
  },
  
  getApplicationsCountForUser: function(userName) {
    return makeJsonpRequest('getApplicationsCountForUser', { userName: userName });
  },
  
  // ===== APPLICATION FUNCTIONS =====
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
  
  getApplicationDetails: function(appNumber) {
    return makeJsonpRequest('getApplicationDetails', { appNumber: appNumber });
  },
  
  getApplicationDocuments: function(appNumber) {
    return makeJsonpRequest('getApplicationDocuments', { appNumber: appNumber });
  },
  
  // ===== APPLICATION CRUD OPERATIONS =====
  saveApplicationDraft: function(applicationData) {
    return makeJsonpRequest('saveApplicationDraft', applicationData);
  },
  
  submitApplication: function(applicationData) {
    return makeJsonpRequest('submitApplication', applicationData);
  },
  
  revertApplicationStage: function(appNumber, targetStage, userName) {
    return makeJsonpRequest('revertApplicationStage', {
      appNumber: appNumber,
      targetStage: targetStage,
      userName: userName
    });
  },
  
  // ===== FILE OPERATIONS =====
  getNewApplicationContext: function() {
    return makeJsonpRequest('getNewApplicationContext');
  },
  
  copyLendingTemplate: function(appNumber, appFolderId) {
    return makeJsonpRequest('copyLendingTemplate', {
      appNumber: appNumber,
      appFolderId: appFolderId
    });
  },
  
  uploadApplicationFile: function(fileData, appNumber, appFolderId, docType) {
    return makeJsonpRequest('uploadApplicationFile', {
      fileData: fileData,
      appNumber: appNumber,
      appFolderId: appFolderId,
      docType: docType
    });
  },
  
  updateApplicationFile: function(fileData, appNumber, docType, userName) {
    return makeJsonpRequest('updateApplicationFile', {
      fileData: fileData,
      appNumber: appNumber,
      docType: docType,
      userName: userName
    });
  },
  
  removeApplicationFile: function(appNumber, fileName, userName) {
    return makeJsonpRequest('removeApplicationFile', {
      appNumber: appNumber,
      fileName: fileName,
      userName: userName
    });
  },
  
  // ===== USER MANAGEMENT FUNCTIONS =====
  getAllUsers: function() {
    return makeJsonpRequest('getAllUsers');
  },
  
  addUser: function(userData) {
    return makeJsonpRequest('addUser', userData);
  },
  
  deleteUser: function(userName) {
    return makeJsonpRequest('deleteUser', { userName: userName });
  },
  
  // ===== WORKFLOW & STAGE FUNCTIONS =====
  getStageForRole: function(role) {
    return makeJsonpRequest('getStageForRole', { role: role });
  },
  
  getNextStageAndStatus: function(currentStage, action) {
    return makeJsonpRequest('getNextStageAndStatus', {
      currentStage: currentStage,
      action: action
    });
  },
  
  canUserActOnApplication: function(userName, stage) {
    return makeJsonpRequest('canUserActOnApplication', {
      userName: userName,
      stage: stage
    });
  },
  
  updateStageTracking: function(appNumber, stage, userName) {
    return makeJsonpRequest('updateStageTracking', {
      appNumber: appNumber,
      stage: stage,
      userName: userName
    });
  },
  
  // ===== UTILITY FUNCTIONS =====
  getApplicationDetailsUnrestricted: function(appNumber) {
    return makeJsonpRequest('getApplicationDetailsUnrestricted', { appNumber: appNumber });
  },
  
  findApplicationRow: function(appNumber) {
    return makeJsonpRequest('findApplicationRow', { appNumber: appNumber });
  },
  
  findActionByForNextStage: function(nextStage, currentUser) {
    return makeJsonpRequest('findActionByForNextStage', {
      nextStage: nextStage,
      currentUser: currentUser
    });
  },
  
  // ===== SHEET & CONFIG FUNCTIONS =====
  initializeSpreadsheet: function() {
    return makeJsonpRequest('initializeSpreadsheet');
  },
  
  getSpreadsheet: function() {
    return makeJsonpRequest('getSpreadsheet');
  },
  
  getUsersSheet: function() {
    return makeJsonpRequest('getUsersSheet');
  },
  
  clearCache: function() {
    return makeJsonpRequest('clearCache');
  },
  
  // ===== TEST & DIAGNOSTIC FUNCTIONS =====
  testConnection: function() {
    return makeJsonpRequest('getAllApplicationCounts')
      .then(() => ({ 
        connected: true, 
        message: 'Successfully connected to Loan Application Tracker API' 
      }))
      .catch(error => ({ 
        connected: false, 
        message: 'Connection failed: ' + error.message 
      }));
  },
  
  // Quick test
  ping: function() {
    return makeJsonpRequest('getAllApplicationCounts', {}, { timeout: 5000 });
  }
};

// ===== GLOBAL STATE MANAGEMENT =====
let APP_STATE = {
  user: null,
  permissions: null,
  currentSection: 'new',
  lastUpdate: null,
  notifications: []
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
  APP_STATE.lastUpdate = new Date().toISOString();
  
  // Persist to localStorage for certain keys
  const persistKeys = ['user', 'permissions'];
  if (persistKeys.includes(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function loadAppState() {
  const user = localStorage.getItem('user');
  const permissions = localStorage.getItem('permissions');
  
  if (user) APP_STATE.user = JSON.parse(user);
  if (permissions) APP_STATE.permissions = JSON.parse(permissions);
}

// Initialize state
loadAppState();

// ===== CACHE MANAGEMENT =====
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }
  
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data: data,
      expiry: Date.now() + ttl
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Create cache instance
const apiCache = new ApiCache();

// ===== ENHANCED API WITH CACHING =====
const cachedGasAPI = new Proxy(gasAPI, {
  get: function(target, prop) {
    // Return original method if it doesn't exist
    if (!target[prop]) return undefined;
    
    // If method should be cached, wrap it
    const cacheableMethods = [
      'getNewApplications',
      'getPendingApplications',
      'getPendingApprovalApplications',
      'getApprovedApplications',
      'getAllApplicationCounts',
      'getAllUsers',
      'getApplicationDetails',
      'getApplicationDocuments'
    ];
    
    if (cacheableMethods.includes(prop)) {
      return function(...args) {
        const cacheKey = `${prop}_${JSON.stringify(args)}`;
        const cached = apiCache.get(cacheKey);
        
        if (cached) {
          console.log(`Cache hit for ${prop}`);
          return Promise.resolve(cached);
        }
        
        return target[prop].apply(this, args).then(response => {
          if (response && response.success !== false) {
            apiCache.set(cacheKey, response);
          }
          return response;
        });
      };
    }
    
    // Return original method for non-cacheable methods
    return target[prop];
  }
});

// ===== INITIALIZATION =====
// Make available globally
window.gasAPI = cachedGasAPI;
window.getConfig = getConfig;
window.getAppState = getAppState;
window.updateAppState = updateAppState;

// For backward compatibility
window.apiService = window.gasAPI;

// Add loading helper functions if they don't exist
if (!window.showLoading) {
  window.showLoading = function(show = true) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
      document.body.style.overflow = show ? 'hidden' : 'auto';
    }
  };
}

if (!window.hideLoading) {
  window.hideLoading = function() {
    window.showLoading(false);
  };
}

// Auto-test connection on load
document.addEventListener('DOMContentLoaded', function() {
  // Test connection after a short delay
  setTimeout(async () => {
    try {
      const test = await window.gasAPI.testConnection();
      console.log('API Connection Test:', test);
      
      // Update app state with connection status
      updateAppState('apiConnected', test.connected);
      
    } catch (error) {
      console.warn('API connection test failed:', error);
      updateAppState('apiConnected', false);
    }
  }, 1000);
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gasAPI: window.gasAPI,
    getConfig,
    getAppState,
    updateAppState,
    GAS_CONFIG
  };
}

console.log('Loan Application Tracker API Client initialized');
