// Simple API Loader - Loads all API modules in order
class SimpleAPILoader {
  static async loadAll() {
    const modules = [
      'api/api-core.js',
      'api/api-auth.js',
      'api/api-applications.js',
      'api/api-new-application.js',    // ADDED
      'api/api-view-application.js',    // ADDED
      'api/api-users.js',
      'api/api-files.js',
      'api/api-workflow.js',
      'api/api-utils.js',
      'api/main-api.js'
    ];
    
    console.log('Loading API modules...');
    
    for (const module of modules) {
      try {
        await this.loadScript(module);
        console.log(`✓ Loaded: ${module}`);
      } catch (error) {
        console.error(`✗ Failed to load: ${module}`, error);
        throw error;
      }
    }
    
    console.log('All API modules loaded successfully');
    return true;
  }
  
  static loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }
}

// Make available globally
window.ApiLoader = SimpleAPILoader;
