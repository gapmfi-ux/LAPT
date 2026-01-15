class GASAPIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async callFunction(functionName, params = {}) {
    try {
      // For Google Apps Script Web Apps, we need to use a different approach
      // because of CORS restrictions. We'll use Google's /dev endpoint
      const url = `${this.baseUrl}?action=${functionName}`;
      
      const formData = new FormData();
      Object.keys(params).forEach(key => {
        formData.append(key, JSON.stringify(params[key]));
      });
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      // Parse response text as JSON
      const text = await response.text();
      return JSON.parse(text);
      
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(`Failed to call ${functionName}: ${error.message}`);
    }
  }

  // Authentication
  async authenticateUser(name) {
    return this.callFunction('authenticateUser', { name });
  }

  // Application functions
  async getNewApplications() {
    return this.callFunction('getNewApplications');
  }

  async getPendingApplications() {
    return this.callFunction('getPendingApplications');
  }

  async getPendingApprovalApplications() {
    return this.callFunction('getPendingApprovalApplications');
  }

  async getApprovedApplications() {
    return this.callFunction('getApprovedApplications');
  }

  async getApplicationDetails(appNumber, userName) {
    return this.callFunction('getApplicationDetails', { appNumber, userName });
  }

  async saveProcessApplicationForm(appNumber, formData) {
    return this.callFunction('saveProcessApplicationForm', { appNumber, formData });
  }

  async getNewApplicationContext() {
    return this.callFunction('getNewApplicationContext');
  }

  async getAllApplicationCounts() {
    return this.callFunction('getAllApplicationCounts');
  }

  async getApplicationsCountForUser(userName) {
    return this.callFunction('getApplicationsCountForUser', { userName });
  }

  // User management
  async getAllUsers() {
    return this.callFunction('getAllUsers');
  }

  async addUser(userData) {
    return this.callFunction('addUser', userData);
  }

  async deleteUser(userName) {
    return this.callFunction('deleteUser', { userName });
  }

  // File operations
  async uploadApplicationFile(fileObj, appNumber, appFolderId, docType) {
    return this.callFunction('uploadApplicationFile', { 
      fileObj, 
      appNumber, 
      appFolderId, 
      docType 
    });
  }
}

// Create global instance
const gasAPI = new GASAPIClient(APP_CONFIG.API_BASE_URL);
