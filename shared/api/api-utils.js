// Utility API Functions
const UtilsAPI = {
  // Initialize spreadsheet
  initializeSpreadsheet: function() {
    return ApiCore.makeJsonpRequest('initializeSpreadsheet');
  },
  
  // Get spreadsheet
  getSpreadsheet: function() {
    return ApiCore.makeJsonpRequest('getSpreadsheet');
  },
  
  // Get users sheet
  getUsersSheet: function() {
    return ApiCore.makeJsonpRequest('getUsersSheet');
  },
  
  // Clear cache
  clearCache: function() {
    ApiCore.apiCache.clear();
    return ApiCore.makeJsonpRequest('clearCache');
  },
  
  // Test connection
  testConnection: function() {
    return ApiCore.makeJsonpRequest('getAllApplicationCounts', {}, { timeout: 10000 })
      .then(() => ({ 
        connected: true, 
        message: 'API connection successful',
        timestamp: new Date().toISOString()
      }))
      .catch(error => ({ 
        connected: false, 
        message: 'API connection failed: ' + error.message,
        timestamp: new Date().toISOString()
      }));
  },
  
  // Ping server
  ping: function() {
    const startTime = Date.now();
    return ApiCore.makeJsonpRequest('getAllApplicationCounts', {}, { timeout: 5000 })
      .then(() => ({
        success: true,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }))
      .catch(error => ({
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }));
  },
  
  // Get server time
  getServerTime: function() {
    return ApiCore.makeJsonpRequest('ping', {}, { timeout: 5000 })
      .then(response => ({
        serverTime: new Date().toISOString(),
        responseTime: response.timestamp
      }))
      .catch(() => ({
        serverTime: null,
        responseTime: null,
        error: 'Could not reach server'
      }));
  }
};

// Export
window.UtilsAPI = UtilsAPI;
