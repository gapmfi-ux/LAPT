// Configuration for GitHub Pages deployment
const GAS_CONFIG = {
    // Replace this with your Google Apps Script Web App URL
    // Format: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
    
    // Application settings
    APP_NAME: 'Loan Application Tracker',
    VERSION: '1.0.0',
    
    // Default settings
    DEFAULT_PAGE_SIZE: 20,
    
    // Notification settings
    NOTIFICATION_CHECK_INTERVAL: 30000, // 30 seconds
    AUTO_REFRESH_INTERVAL: 60000, // 60 seconds
};

// Global state
let APP_STATE = {
    user: null,
    token: null,
    permissions: null,
    currentSection: 'new'
};

// Helper function to get config
function getConfig() {
    return GAS_CONFIG;
}

// Helper function to get state
function getAppState() {
    return APP_STATE;
}

// Update app state
function updateAppState(key, value) {
    APP_STATE[key] = value;
    
    // Persist to localStorage for certain keys
    const persistKeys = ['user', 'permissions'];
    if (persistKeys.includes(key)) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

// Load state from localStorage
function loadAppState() {
    const user = localStorage.getItem('user');
    const permissions = localStorage.getItem('permissions');
    
    if (user) APP_STATE.user = JSON.parse(user);
    if (permissions) APP_STATE.permissions = JSON.parse(permissions);
}

// Initialize state
loadAppState();
