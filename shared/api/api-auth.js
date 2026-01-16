// Authentication API Functions
const AuthAPI = {
  // User authentication
  authenticateUser: function(userName) {
    return ApiCore.makeJsonpRequest('authenticate', { userName: userName });
  },
  
  // Get user permissions
  getUserPermissions: function(userName) {
    return ApiCore.makeJsonpRequest('getUserPermissions', { userName: userName });
  },
  
  // Get application count for user
  getApplicationsCountForUser: function(userName) {
    const cacheKey = `user_apps_count_${userName}`;
    return ApiCore.makeJsonpRequest('getApplicationsCountForUser', 
      { userName: userName }, 
      { useCache: true, cacheKey: cacheKey }
    );
  },
  
  // Test authentication
  testAuth: function(userName) {
    return this.authenticateUser(userName)
      .then(result => ({
        authenticated: result.success,
        user: result.user,
        message: result.success ? 'Authentication successful' : result.message
      }))
      .catch(error => ({
        authenticated: false,
        message: 'Authentication failed: ' + error.message
      }));
  }
};

// Export
window.AuthAPI = AuthAPI;
