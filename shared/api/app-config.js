// Application Configuration
const AppConfig = {
  // API Configuration
  API: {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec',
    TIMEOUT: 30000,
    CACHE_TTL: 5 * 60 * 1000 // 5 minutes
  },
  
  // Application Settings
  APP: {
    NAME: 'Loan Application Tracker',
    VERSION: '1.0.0',
    DEFAULT_PAGE_SIZE: 20,
    AUTO_REFRESH_INTERVAL: 60000, // 60 seconds
    NOTIFICATION_CHECK_INTERVAL: 30000 // 30 seconds
  },
  
  // UI Settings
  UI: {
    THEME: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#0ea5e9'
    },
    ANIMATION_DURATION: 200,
    TOAST_DURATION: 5000
  },
  
  // Workflow Settings
  WORKFLOW: {
    STAGES: ['New', 'Assessment', 'Compliance', 'Ist Review', '2nd Review', 'Approval'],
    STATUSES: ['NEW', 'PENDING', 'PENDING APPROVAL', 'APPROVED', 'REJECTED']
  },
  
  // Document Types
  DOCUMENTS: {
    BANK_STATEMENT: 'bankStatement',
    PAY_SLIP: 'paySlip',
    UNDERTAKING: 'undertaking',
    LOAN_STATEMENT: 'loanStatement',
    TEMPLATE: 'template'
  },
  
  // Get configuration
  get(key) {
    return key.split('.').reduce((obj, k) => obj && obj[k], this);
  },
  
  // Update configuration
  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => obj[k] = obj[k] || {}, this);
    target[lastKey] = value;
    return this;
  }
};

// Export
window.AppConfig = AppConfig;
