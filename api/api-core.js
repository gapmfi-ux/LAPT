// API Core Configuration and Base Functions
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

// ===== GLOBAL STATE MANAGEMENT =====
window.APP_STATE = {
    user: null,
    permissions: null,
    currentSection: 'new',
    lastUpdate: null,
    notifications: [],
    apiConnected: null
};

// Helper functions
function getConfig() {
    return GAS_CONFIG;
}

function getAppState() {
    return window.APP_STATE;
}

function updateAppState(key, value) {
    window.APP_STATE[key] = value;
    window.APP_STATE.lastUpdate = new Date().toISOString();
    
    // Persist to localStorage for certain keys
    const persistKeys = ['user', 'permissions'];
    if (persistKeys.includes(key)) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

function loadAppState() {
    const user = localStorage.getItem('user');
    const permissions = localStorage.getItem('permissions');
    
    if (user) window.APP_STATE.user = JSON.parse(user);
    if (permissions) window.APP_STATE.permissions = JSON.parse(permissions);
}

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
window.apiCache = new ApiCache();

// Initialize state
loadAppState();

// Export core functions
window.makeJsonpRequest = makeJsonpRequest;
window.getConfig = getConfig;
window.getAppState = getAppState;
window.updateAppState = updateAppState;

console.log('API Core module loaded');
