// Core JSONP API functionality
const API_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
  DEFAULT_TIMEOUT: 30000,
  CACHE_TTL: 5 * 60 * 1000 // 5 minutes
};

// Cache Manager
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = API_CONFIG.CACHE_TTL;
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
  
  clear(pattern = '') {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const [key] of this.cache) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// JSONP Request Function
function makeJsonpRequest(action, params = {}, options = {}) {
  const {
    timeout = API_CONFIG.DEFAULT_TIMEOUT,
    useCache = false,
    cacheKey = null
  } = options;
  
  // Check cache first
  if (useCache && cacheKey) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${action}`);
      return Promise.resolve(cached);
    }
  }
  
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    // Build URL
    let url = API_CONFIG.WEB_APP_URL + '?action=' + encodeURIComponent(action);
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
        // Cache the response if needed
        if (useCache && cacheKey) {
          apiCache.set(cacheKey, data);
        }
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
    
    // Timeout
    setTimeout(() => {
      if (window[callbackName]) {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
        reject(new Error(`Request timeout after ${timeout/1000} seconds`));
      }
    }, timeout);
  });
}

// Create cache instance
const apiCache = new ApiCache();

// Export
window.ApiCore = {
  makeJsonpRequest,
  apiCache,
  API_CONFIG
};
