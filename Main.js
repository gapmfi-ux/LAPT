// Main.js - Updated for GitHub Pages with GAS API
const cachedElements = {};
let currentAppNumber = "";
let currentAppFolderId = "";
let currentViewingAppData = null;

// Cache frequently used elements
function cacheElements() {
  const elements = {
    'app-container': 'app-container',
    'loading-screen': 'loading-screen',
    'logged-in-user': 'logged-in-user',
    'current-date': 'current-date',
    'user-notification-badge': 'user-notification-badge'
  };
  
  for (const [key, id] of Object.entries(elements)) {
    cachedElements[key] = document.getElementById(id);
  }
}

// Load HTML component
async function loadComponent(componentPath) {
  try {
    const response = await fetch(componentPath);
    return await response.text();
  } catch (error) {
    console.error('Error loading component:', error);
    return '<div class="error">Failed to load component</div>';
  }
}

// Load CSS dynamically
function loadCSS(cssPath) {
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
}

// Load JS dynamically
function loadJS(jsPath) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`script[src="${jsPath}"]`)) {
      const script = document.createElement('script');
      script.src = jsPath;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    } else {
      resolve();
    }
  });
}

// Show/Hide loading
function showLoading() {
  if (cachedElements['loading-screen']) {
    cachedElements['loading-screen'].style.display = 'flex';
  }
}

function hideLoading() {
  if (cachedElements['loading-screen']) {
    cachedElements['loading-screen'].style.display = 'none';
  }
}

// Navigation functions
async function navigateToDashboard() {
  showLoading();
  
  // Load main dashboard HTML
  const dashboardHTML = `
    <div class="top-menu">
      <!-- Your top menu HTML -->
    </div>
    <div class="container">
      <!-- Your main content -->
    </div>
  `;
  
  document.getElementById('app-container').innerHTML = dashboardHTML;
  
  // Load required CSS and JS
  loadCSS('applications/AppsTables.css');
  loadCSS('new-application/newApps.css');
  loadCSS('view-application/viewApps.css');
  
  await loadJS('applications/AppsTables.js');
  await loadJS('workflow/AccessStage.js');
  
  // Initialize dashboard
  initializeDashboard();
  hideLoading();
}

async function navigateToUserManagement() {
  showLoading();
  
  const html = await loadComponent('user-management/UserMgt.html');
  document.getElementById('app-container').innerHTML = html;
  
  loadCSS('user-management/UserMgt.css');
  await loadJS('user-management/UserMgt.js');
  
  hideLoading();
}

async function navigateToNewApplication() {
  showLoading();
  
  const html = await loadComponent('new-application/newApps.html');
  document.getElementById('app-container').innerHTML = html;
  
  loadCSS('new-application/newApps.css');
  await loadJS('new-application/newApps.js');
  
  hideLoading();
}

// Authentication functions
function checkAuth() {
  const user = localStorage.getItem('loggedInName');
  if (!user) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('loggedInName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userLevel');
    window.location.hash = '#/login';
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  
  // Handle hash routing
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
  
  // Set current date
  if (cachedElements['current-date']) {
    cachedElements['current-date'].textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
});

async function handleRoute() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  
  switch(hash) {
    case '/dashboard':
      if (checkAuth()) await navigateToDashboard();
      break;
    case '/user-management':
      if (checkAuth()) await navigateToUserManagement();
      break;
    case '/new-application':
      if (checkAuth()) await navigateToNewApplication();
      break;
    case '/login':
      await navigateToLogin();
      break;
    default:
      if (checkAuth()) await navigateToDashboard();
  }
}

async function navigateToLogin() {
  showLoading();
  
  const html = await loadComponent('login/Login.html');
  document.getElementById('app-container').innerHTML = html;
  
  loadCSS('login/Login.css');
  await loadJS('login/Login.js');
  
  hideLoading();
}

// Make functions available globally
window.navigateToDashboard = navigateToDashboard;
window.navigateToUserManagement = navigateToUserManagement;
window.navigateToNewApplication = navigateToNewApplication;
window.logout = logout;
window.gasAPI = gasAPI;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
