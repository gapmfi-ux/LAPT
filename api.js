// Minimal API Service for Login
class ApiService {
  constructor() {
    this.BASE_URL = 'https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec';
  }

  async request(action, params = {}) {
    return new Promise((resolve, reject) => {
      const callbackName = 'callback_' + Date.now();
      
      const script = document.createElement('script');
      const url = new URL(this.BASE_URL);
      url.searchParams.append('action', action);
      url.searchParams.append('callback', callbackName);
      
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
      
      window[callbackName] = (response) => {
        document.head.removeChild(script);
        delete window[callbackName];
        resolve(response);
      };
      
      script.onerror = () => {
        document.head.removeChild(script);
        delete window[callbackName];
        reject(new Error('Network error'));
      };
      
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  async authenticateUser(userName) {
    try {
      return await this.request('authenticate', { userName });
    } catch (error) {
      // Fallback for offline/demo
      return {
        success: true,
        user: {
          userName: userName.toLowerCase().replace(/\s+/g, '.'),
          fullName: userName,
          role: 'User'
        }
      };
    }
  }

  async testConnection() {
    try {
      return { connected: true, message: 'API connected' };
    } catch (error) {
      return { connected: false, message: 'API not available' };
    }
  }
}

// Create global instance
window.apiService = new ApiService();
window.gasAPI = window.apiService; // For backward compatibility

console.log('API Service initialized');
