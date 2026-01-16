// SIMPLIFIED API Client - Login Only
const GAS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
  APP_NAME: 'Loan Application Tracker'
};

// Simple JSONP request for login
function makeJsonpRequest(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'callback_' + Date.now();
    
    // Build URL
    let url = GAS_CONFIG.WEB_APP_URL + '?action=' + encodeURIComponent(action);
    url += '&callback=' + callbackName;
    
    // Add parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }
    });
    
    // Create script element
    const script = document.createElement('script');
    
    // Define callback
    window[callbackName] = function(data) {
      // Cleanup
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      delete window[callbackName];
      resolve(data);
    };
    
    // Error handling
    script.onerror = function() {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      delete window[callbackName];
      reject(new Error('Network error'));
    };
    
    // Add to page
    script.src = url;
    document.body.appendChild(script);
    
    // Timeout
    setTimeout(() => {
      if (window[callbackName]) {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
        reject(new Error('Request timeout'));
      }
    }, 10000);
  });
}

// Only login method for now
const gasAPI = {
  authenticateUser: function(userName) {
    return makeJsonpRequest('authenticate', { userName: userName });
  }
};

// Make available globally
window.gasAPI = gasAPI;
window.getConfig = () => GAS_CONFIG;
