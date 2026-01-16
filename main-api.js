// Main API Aggregator with Caching Proxy
if (typeof window.makeJsonpRequest === 'undefined') {
    console.error('api-core.js must be loaded before main-api.js');
} else {
    // Combine all APIs
    const combinedAPI = {
        ...window.authAPI,
        ...window.applicationsAPI,
        ...window.usersAPI,
        ...window.filesAPI,
        ...window.workflowAPI,
        ...window.utilsAPI
    };
    
    // Create cached proxy
    const cachedGasAPI = new Proxy(combinedAPI, {
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
                'getApplicationDocuments',
                'getStageForRole'
            ];
            
            if (cacheableMethods.includes(prop)) {
                return function(...args) {
                    const cacheKey = `${prop}_${JSON.stringify(args)}`;
                    const cached = window.apiCache.get(cacheKey);
                    
                    if (cached) {
                        console.log(`Cache hit for ${prop}`);
                        return Promise.resolve(cached);
                    }
                    
                    return target[prop].apply(this, args).then(response => {
                        if (response && response.success !== false) {
                            window.apiCache.set(cacheKey, response);
                        }
                        return response;
                    });
                };
            }
            
            // Return original method for non-cacheable methods
            return target[prop];
        }
    });
    
    // Make available globally
    window.gasAPI = cachedGasAPI;
    window.apiService = cachedGasAPI; // Alias for backward compatibility
    
    // Initialize loading helpers if they don't exist
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
    
    // Auto-test connection
    document.addEventListener('DOMContentLoaded', async () => {
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
            getConfig: window.getConfig,
            getAppState: window.getAppState,
            updateAppState: window.updateAppState,
            GAS_CONFIG: window.GAS_CONFIG
        };
    }
    
    console.log('Main API module loaded - Loan Application Tracker API Client initialized');
}
