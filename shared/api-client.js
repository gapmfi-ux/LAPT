// API Service for Loan Application Tracker (Google Apps Script Backend)
class LoanTrackerApi {
  constructor() {
    // Your Google Apps Script Web App URL
    this.BASE_URL = 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec';
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Generic request method using JSONP (for CORS bypass)
  async request(action, data = {}, options = {}) {
    const {
      showLoading = true,
      useCache = false,
      cacheDuration = 300000, // 5 minutes default
      retryCount = 3
    } = options;

    // Generate cache key
    const cacheKey = `${action}_${JSON.stringify(data)}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheDuration) {
        return Promise.resolve(cached.data);
      } else {
        this.cache.delete(cacheKey); // Remove expired cache
      }
    }

    try {
      // Show loading if specified
      if (showLoading && window.showLoading) {
        window.showLoading(true);
      }

      return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const script = document.createElement('script');
        const url = new URL(this.BASE_URL);
        url.searchParams.append('action', action);
        
        // Add data as parameter (for GET) or handle POST
        if (Object.keys(data).length > 0) {
          url.searchParams.append('data', JSON.stringify(data));
        }
        
        url.searchParams.append('callback', callbackName);
        
        // Define callback function
        window[callbackName] = (response) => {
          // Cleanup
          if (script.parentNode) {
            document.head.removeChild(script);
          }
          delete window[callbackName];
          
          // Hide loading
          if (showLoading && window.hideLoading) {
            window.hideLoading();
          }
          
          if (response && (response.success !== false)) {
            // Cache the response
            if (useCache) {
              this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
              });
            }
            resolve(response);
          } else {
            const errorMsg = response ? (response.message || response.error || 'API request failed') : 'No response from server';
            reject(new Error(errorMsg));
          }
        };
        
        script.src = url.toString();
        script.onerror = () => {
          if (script.parentNode) {
            document.head.removeChild(script);
          }
          delete window[callbackName];
          
          if (showLoading && window.hideLoading) {
            window.hideLoading();
          }
          
          reject(new Error('Network error - failed to load script'));
        };
        
        // Add script to document
        document.head.appendChild(script);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (script.parentNode) {
            document.head.removeChild(script);
            delete window[callbackName);
            if (showLoading && window.hideLoading) {
              window.hideLoading();
            }
            reject(new Error('Request timeout after 30 seconds'));
          }
        }, 30000);
      });
      
    } catch (error) {
      if (showLoading && window.hideLoading) {
        window.hideLoading();
      }
      throw error;
    }
  }

  // ===== AUTHENTICATION APIs =====
  async authenticateUser(userName) {
    return this.request('authenticate', { userName });
  }

  async getUserPermissions(userName) {
    return this.request('getUserPermissions', { userName });
  }

  // ===== APPLICATION APIs =====
  async getNewApplications() {
    return this.request('getNewApplications', {}, { useCache: true, cacheDuration: 60000 });
  }

  async getPendingApplications() {
    return this.request('getPendingApplications', {}, { useCache: true, cacheDuration: 60000 });
  }

  async getPendingApprovalApplications() {
    return this.request('getPendingApprovalApplications', {}, { useCache: true, cacheDuration: 60000 });
  }

  async getApprovedApplications() {
    return this.request('getApprovedApplications', {}, { useCache: true, cacheDuration: 60000 });
  }

  async getAllApplicationCounts() {
    return this.request('getAllApplicationCounts', {}, { useCache: true, cacheDuration: 30000 });
  }

  async getApplicationDetails(appNumber) {
    return this.request('getApplicationDetails', { appNumber });
  }

  async getApplicationDocuments(appNumber) {
    return this.request('getApplicationDocuments', { appNumber });
  }

  async saveApplicationDraft(applicationData) {
    return this.request('saveApplicationDraft', applicationData);
  }

  async submitApplication(applicationData) {
    return this.request('submitApplication', applicationData);
  }

  async revertApplicationStage(appNumber, targetStage, userName) {
    return this.request('revertApplicationStage', {
      appNumber,
      targetStage,
      userName
    });
  }

  async getNewApplicationContext() {
    return this.request('getNewApplicationContext');
  }

  async copyLendingTemplate(appNumber, appFolderId) {
    return this.request('copyLendingTemplate', { appNumber, appFolderId });
  }

  async uploadApplicationFile(fileData, appNumber, appFolderId, docType) {
    return this.request('uploadApplicationFile', {
      fileData,
      appNumber,
      appFolderId,
      docType
    });
  }

  async updateApplicationFile(fileData, appNumber, docType, userName) {
    return this.request('updateApplicationFile', {
      fileData,
      appNumber,
      docType,
      userName
    });
  }

  async removeApplicationFile(appNumber, fileName, userName) {
    return this.request('removeApplicationFile', {
      appNumber,
      fileName,
      userName
    });
  }

  // ===== USER MANAGEMENT APIs =====
  async getAllUsers() {
    return this.request('getAllUsers', {}, { useCache: true, cacheDuration: 120000 });
  }

  async addUser(userData) {
    // Clear user cache when adding new user
    this.clearCache('getAllUsers');
    return this.request('addUser', userData);
  }

  async deleteUser(userName) {
    // Clear user cache when deleting user
    this.clearCache('getAllUsers');
    return this.request('deleteUser', { userName });
  }

  // ===== UTILITY METHODS =====
  clearCache(pattern = '') {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const [key] of this.cache) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Test connection
  async testConnection() {
    try {
      const response = await this.request('getAllApplicationCounts', {}, { 
        showLoading: false,
        useCache: false 
      });
      return {
        connected: true,
        message: 'Successfully connected to Loan Application Tracker API',
        data: response
      };
    } catch (error) {
      return {
        connected: false,
        message: 'Connection failed: ' + error.message
      };
    }
  }

  // Queue system for batch operations
  async addToQueue(action, data = {}) {
    this.requestQueue.push({ action, data });
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const request = this.requestQueue.shift();

    try {
      await this.request(request.action, request.data, { showLoading: false });
    } catch (error) {
      console.error('Queue request failed:', error);
    }

    // Process next item after delay
    setTimeout(() => this.processQueue(), 100);
  }
}

// Configuration
const GAS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
  APP_NAME: 'Loan Application Tracker',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 20,
  NOTIFICATION_CHECK_INTERVAL: 30000,
  AUTO_REFRESH_INTERVAL: 60000,
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

// Create global API instance
window.gasAPI = new LoanTrackerApi();
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
    }
  };
}

if (!window.hideLoading) {
  window.hideLoading = function() {
    window.showLoading(false);
  };
}

// Auto-test connection on load (optional)
document.addEventListener('DOMContentLoaded', function() {
  // Test connection after a short delay
  setTimeout(async () => {
    try {
      const test = await window.gasAPI.testConnection();
      console.log('API Connection Test:', test);
    } catch (error) {
      console.warn('API connection test failed:', error);
    }
  }, 1000);
});
