// Main API Aggregator - combines all API modules
const LoanTrackerAPI = {
  // Core functionality
  config: AppConfig,
  cache: ApiCore.apiCache,
  
  // API modules
  auth: AuthAPI,
  applications: ApplicationsAPI,
  users: UsersAPI,
  files: FilesAPI,
  workflow: WorkflowAPI,
  utils: UtilsAPI,
  
  // State management
  state: AppState,
  
  // Initialize
  init() {
    console.log(`${AppConfig.APP.NAME} v${AppConfig.APP.VERSION} API initialized`);
    return this.testConnection();
  },
  
  // Test all connections
  testConnection() {
    return this.utils.testConnection()
      .then(result => {
        this.state.update('apiConnected', result.connected);
        return result;
      });
  },
  
  // Clear all caches
  clearAllCaches() {
    ApiCore.apiCache.clear();
    return { success: true, message: 'All caches cleared' };
  },
  
  // Get API status
  getStatus() {
    return {
      api: this.state.get().apiConnected ? 'connected' : 'disconnected',
      user: this.state.get().user ? 'authenticated' : 'anonymous',
      lastUpdate: this.state.get().lastUpdate,
      cacheSize: ApiCore.apiCache.cache.size
    };
  },
  
  // Batch operations
  batch(operations) {
    return Promise.all(operations.map(op => {
      const [module, method, ...args] = op.split('.');
      if (this[module] && this[module][method]) {
        return this[module][method](...args);
      }
      return Promise.reject(new Error(`Invalid operation: ${op}`));
    }));
  }
};

// Initialize when all modules are loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if all required modules are loaded
  const requiredModules = ['ApiCore', 'AuthAPI', 'ApplicationsAPI', 'AppState', 'AppConfig'];
  const missingModules = requiredModules.filter(module => !window[module]);
  
  if (missingModules.length === 0) {
    window.gasAPI = LoanTrackerAPI;
    window.gasAPI.init().then(status => {
      console.log('API Status:', status);
    });
  } else {
    console.error('Missing API modules:', missingModules);
  }
});

// Export
window.LoanTrackerAPI = LoanTrackerAPI;
