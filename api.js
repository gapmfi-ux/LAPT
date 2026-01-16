// API Service for Google Apps Script Backend - Loan Application Tracker
class ApiService {
  constructor() {
    // UPDATE THIS with your actual Google Apps Script Web App URL
    this.BASE_URL = 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec';
    this.cache = new Map();
    this.DEFAULT_TIMEOUT = 30000; // 30 seconds
  }

  // Generic JSONP request method
  async request(action, params = {}, options = {}) {
    const showLoading = options.showLoading !== false;
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    
    try {
      if (showLoading && window.showLoading) {
        window.showLoading(`Loading ${action.replace(/([A-Z])/g, ' $1')}...`);
      }

      return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Build URL with parameters
        const url = new URL(this.BASE_URL);
        url.searchParams.append('action', action);
        url.searchParams.append('callback', callbackName);
        
        // Add parameters
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            if (typeof params[key] === 'object') {
              url.searchParams.append(key, JSON.stringify(params[key]));
            } else {
              url.searchParams.append(key, params[key]);
            }
          }
        });
        
        // Add cache buster
        url.searchParams.append('_', Date.now());
        
        // Create script element
        const script = document.createElement('script');
        
        // Define callback function
        window[callbackName] = (response) => {
          // Cleanup
          if (script.parentNode) document.head.removeChild(script);
          delete window[callbackName];
          
          if (showLoading && window.hideLoading) {
            window.hideLoading();
          }
          
          if (response && response.success !== false) {
            // Cache successful responses
            const cacheKey = `${action}_${JSON.stringify(params)}`;
            this.cache.set(cacheKey, response);
            resolve(response);
          } else {
            const errorMsg = response ? (response.message || response.error || 'Request failed') : 'No response from server';
            reject(new Error(errorMsg));
          }
        };
        
        // Error handling
        script.onerror = () => {
          if (script.parentNode) document.head.removeChild(script);
          delete window[callbackName];
          
          if (showLoading && window.hideLoading) {
            window.hideLoading();
          }
          
          reject(new Error('Network error - failed to load script'));
        };
        
        // Add script to page
        script.src = url.toString();
        document.head.appendChild(script);
        
        // Timeout
        setTimeout(() => {
          if (window[callbackName]) {
            if (script.parentNode) document.head.removeChild(script);
            delete window[callbackName];
            
            if (showLoading && window.hideLoading) {
              window.hideLoading();
            }
            
            reject(new Error(`Request timeout after ${timeout/1000} seconds`));
          }
        }, timeout);
      });
      
    } catch (error) {
      if (showLoading && window.hideLoading) {
        window.hideLoading();
      }
      throw error;
    }
  }

  // ===== AUTHENTICATION & USER FUNCTIONS =====
  async authenticateUser(userName) {
    return this.request('authenticate', { userName });
  }

  async getUserPermissions(userName) {
    return this.request('getUserPermissions', { userName });
  }

  async getApplicationsCountForUser(userName) {
    return this.request('getApplicationsCountForUser', { userName });
  }

  // ===== APPLICATION FUNCTIONS =====
  async getNewApplications() {
    return this.request('getNewApplications');
  }

  async getPendingApplications() {
    return this.request('getPendingApplications');
  }

  async getPendingApprovalApplications() {
    return this.request('getPendingApprovalApplications');
  }

  async getApprovedApplications() {
    return this.request('getApprovedApplications');
  }

  async getAllApplicationCounts() {
    return this.request('getAllApplicationCounts');
  }

  async getApplicationDetails(appNumber) {
    return this.request('getApplicationDetails', { appNumber });
  }

  async getApplicationDocuments(appNumber) {
    return this.request('getApplicationDocuments', { appNumber });
  }

  async getNewApplicationContext() {
    return this.request('getNewApplicationContext');
  }

  // ===== USER MANAGEMENT FUNCTIONS =====
  async getAllUsers() {
    return this.request('getAllUsers');
  }

  async addUser(userData) {
    return this.request('addUser', userData);
  }

  async deleteUser(userName) {
    return this.request('deleteUser', { userName });
  }

  // ===== UTILITY FUNCTIONS =====
  async testConnection() {
    try {
      // Quick test with minimal data
      const response = await this.request('getAllApplicationCounts', {}, { timeout: 5000 });
      return {
        connected: true,
        message: 'Successfully connected to Loan Application Tracker API',
        response: response
      };
    } catch (error) {
      return {
        connected: false,
        message: 'Connection failed: ' + error.message
      };
    }
  }

  // Quick ping
  async ping() {
    return this.request('getAllApplicationCounts', {}, { timeout: 5000, showLoading: false });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cached response
  getCached(action, params = {}) {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    return this.cache.get(cacheKey);
  }
}

// Create global API instances with backward compatibility
window.apiService = new ApiService();
window.gasAPI = window.apiService; // For backward compatibility

console.log('Loan Application Tracker API Service initialized');
