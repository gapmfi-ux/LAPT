// Utility API Functions
if (typeof window.makeJsonpRequest === 'undefined') {
    console.error('api-core.js must be loaded before api-utils.js');
} else {
    const utilsAPI = {
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
            window.apiCache.clear();
            return makeJsonpRequest('clearCache');
        },
        
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
        
        ping: function() {
            return new Promise((resolve) => {
                const timeoutId = setTimeout(() => {
                    resolve({ connected: false, message: 'Request timeout' });
                }, 5000);
                
                makeJsonpRequest('getAllApplicationCounts', {}, { timeout: 5000 })
                    .then(() => {
                        clearTimeout(timeoutId);
                        resolve({ connected: true, message: 'Ping successful' });
                    })
                    .catch(() => {
                        clearTimeout(timeoutId);
                        resolve({ connected: false, message: 'Ping failed' });
                    });
            });
        },
        
        // Helper method to format application numbers
        formatAppNumber: function(appNumber) {
            if (!appNumber) return '';
            return `APP-${String(appNumber).padStart(6, '0')}`;
        },
        
        // Helper method to format dates
        formatDate: function(dateString, format = 'short') {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            if (format === 'short') {
                return date.toLocaleDateString();
            } else if (format === 'long') {
                return date.toLocaleString();
            } else if (format === 'relative') {
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 60) return `${diffMins} minutes ago`;
                if (diffHours < 24) return `${diffHours} hours ago`;
                if (diffDays < 7) return `${diffDays} days ago`;
                return date.toLocaleDateString();
            }
            
            return date.toISOString().split('T')[0];
        }
    };
    
    // Make available globally
    window.utilsAPI = utilsAPI;
    console.log('Utils API module loaded');
}
