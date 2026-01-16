// Authentication API methods
class AuthAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  async authenticateUser(userName) {
    return this.api.request('authenticate', { userName });
  }

  async getUserPermissions(userName) {
    return this.api.request('getUserPermissions', { userName });
  }

  async getApplicationsCountForUser(userName) {
    // This function returns a number, not an object
    return this.api.request('getApplicationsCountForUser', { userName });
  }

  // Fallback authentication for demo/offline mode
  async authenticateUserFallback(userName) {
    return {
      success: true,
      user: {
        userName: userName.toLowerCase().replace(/\s+/g, '.'),
        fullName: userName,
        role: 'User',
        permissions: ['view_applications']
      }
    };
  }
}
