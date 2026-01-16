// User Management API Functions
if (typeof window.makeJsonpRequest === 'undefined') {
    console.error('api-core.js must be loaded before api-users.js');
} else {
    const usersAPI = {
        getAllUsers: function() {
            return makeJsonpRequest('getAllUsers');
        },
        
        addUser: function(userData) {
            return makeJsonpRequest('addUser', userData);
        },
        
        deleteUser: function(userName) {
            return makeJsonpRequest('deleteUser', { userName: userName });
        },
        
        // Helper method to validate user data
        validateUserData: function(userData) {
            const requiredFields = ['userName', 'fullName', 'email', 'role'];
            const missingFields = requiredFields.filter(field => !userData[field]);
            
            if (missingFields.length > 0) {
                return {
                    valid: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                };
            }
            
            if (!['admin', 'underwriter', 'reviewer', 'viewer'].includes(userData.role)) {
                return {
                    valid: false,
                    message: 'Invalid role. Must be one of: admin, underwriter, reviewer, viewer'
                };
            }
            
            return { valid: true };
        }
    };
    
    // Make available globally
    window.usersAPI = usersAPI;
    console.log('Users API module loaded');
}
