// API Loader - ensures proper loading order
const API_LOAD_ORDER = [
  'shared/api/api-core.js',
  'shared/api/api-auth.js',
  'shared/api/api-applications.js',
  'shared/api/api-users.js',
  'shared/api/api-files.js',
  'shared/api/api-workflow.js',
  'shared/api/api-utils.js',
  'shared/api/main-api.js'
];

function loadAPIScripts() {
  return new Promise((resolve, reject) => {
    let loaded = 0;
    
    API_LOAD_ORDER.forEach((src, index) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        loaded++;
        if (loaded === API_LOAD_ORDER.length) {
          console.log('All API scripts loaded');
          resolve();
        }
      };
      script.onerror = () => {
        console.error('Failed to load:', src);
        reject(new Error(`Failed to load ${src}`));
      };
      
      // Add to document
      document.head.appendChild(script);
    });
  });
}

// Auto-load if this is the main page
if (document.getElementById('app-container')) {
  loadAPIScripts().then(() => {
    console.log('API ready, initializing app...');
    if (typeof initializeApp === 'function') {
      setTimeout(initializeApp, 100);
    }
  }).catch(error => {
    console.error('Failed to load API:', error);
  });
}

window.loadAPIScripts = loadAPIScripts;
