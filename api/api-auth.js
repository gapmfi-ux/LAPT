// Authentication API Functions
if (typeof window.makeJsonpRequest === 'undefined') {
    console.error('api-core.js must be loaded before api-auth.js');
} else {
    const authAPI = {
        authenticateUser: function(userName) {
            return makeJsonpRequest('authenticate', { userName: userName });
        },
        
        getUserPermissions: function(userName) {
            return makeJsonpRequest('getUserPermissions', { userName: userName });
        },
        
        getApplicationsCountForUser: function(userName) {
            return makeJsonpRequest('getApplicationsCountForUser', { userName: userName });
        },
        
        // Helper method for login
        login: async function(userName) {
            try {
                const authResult = await this.authenticateUser(userName);
                if (authResult.success) {
                    const permissions = await this.getUserPermissions(userName);
                    updateAppState('user', authResult.user);
                    updateAppState('permissions', permissions.data);
                    return { success: true, user: authResult.user, permissions: permissions.data };
                }
                return { success: false, message: authResult.message || 'Authentication failed' };
            } catch (error) {
                return { success: false, message: error.message };
            }
        },
        
        logout: function() {
            updateAppState('user', null);
            updateAppState('permissions', null);
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
            window.apiCache.clear();
            return { success: true, message: 'Logged out successfully' };
        }
    };
    
    // Make available globally
    window.authAPI = authAPI;
    console.log('Auth API module loaded');
}
