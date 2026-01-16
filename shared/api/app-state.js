// Global Application State Management
const AppState = {
  // Initial state
  state: {
    user: null,
    permissions: null,
    currentSection: 'new',
    apiConnected: false,
    lastUpdate: null,
    notifications: [],
    loading: false,
    error: null
  },
  
  // Initialize from localStorage
  init() {
    const user = localStorage.getItem('user');
    const permissions = localStorage.getItem('permissions');
    
    if (user) this.state.user = JSON.parse(user);
    if (permissions) this.state.permissions = JSON.parse(permissions);
    
    this.state.lastUpdate = new Date().toISOString();
    return this.state;
  },
  
  // Get state
  get() {
    return { ...this.state };
  },
  
  // Update state
  update(key, value) {
    this.state[key] = value;
    this.state.lastUpdate = new Date().toISOString();
    
    // Persist to localStorage for certain keys
    const persistKeys = ['user', 'permissions'];
    if (persistKeys.includes(key)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    
    // Trigger state change event
    this.triggerChange();
    return this.state;
  },
  
  // Multiple updates
  batch(updates) {
    Object.keys(updates).forEach(key => {
      this.state[key] = updates[key];
    });
    this.state.lastUpdate = new Date().toISOString();
    this.triggerChange();
    return this.state;
  },
  
  // Reset state
  reset() {
    this.state = {
      user: null,
      permissions: null,
      currentSection: 'new',
      apiConnected: false,
      lastUpdate: new Date().toISOString(),
      notifications: [],
      loading: false,
      error: null
    };
    this.triggerChange();
    return this.state;
  },
  
  // State change listeners
  listeners: [],
  
  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },
  
  // Trigger change event
  triggerChange() {
    this.listeners.forEach(callback => {
      try {
        callback({ ...this.state });
      } catch (error) {
        console.error('State change listener error:', error);
      }
    });
  },
  
  // Loading state
  setLoading(loading) {
    return this.update('loading', loading);
  },
  
  // Error state
  setError(error) {
    return this.update('error', error);
  },
  
  // Clear error
  clearError() {
    return this.update('error', null);
  },
  
  // Add notification
  addNotification(notification) {
    const notifications = [...this.state.notifications, notification];
    return this.update('notifications', notifications);
  },
  
  // Clear notifications
  clearNotifications() {
    return this.update('notifications', []);
  }
};

// Initialize
AppState.init();

// Export
window.AppState = AppState;
