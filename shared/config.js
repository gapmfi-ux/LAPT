// Replace with your actual Google Apps Script Web App URL
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec';

// Global configuration
const APP_CONFIG = {
  API_BASE_URL: GAS_WEB_APP_URL,
  APP_NAME: 'Loan Application Tracker',
  VERSION: '1.0.0',
  
  // Default fetch options
  FETCH_OPTIONS: {
    method: 'POST',
    mode: 'no-cors', // Important for cross-origin requests
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

// Global state - REMOVED (this is now declared in api-client.js)
// let APP_STATE = {
//   user: null,
//   token: null,
//   permissions: null
// };
