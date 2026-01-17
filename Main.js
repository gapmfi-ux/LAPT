// ===== GLOBAL VARIABLES =====
const cachedElements = {};
let currentAppNumber = "";
let currentAppFolderId = "";
let lastAppCount = 0;
let notificationCheckInterval;
let refreshInterval;
let currentViewingAppData = null;

// ===== API INITIALIZATION =====
async function initializeAPI() {
    try {
        // If an ApiLoader exists, load modules.
        if (window.ApiLoader && typeof window.ApiLoader.loadAll === 'function') {
            try {
                await window.ApiLoader.loadAll();
                console.log('API modules loaded successfully via ApiLoader');
            } catch (err) {
                console.warn('ApiLoader.loadAll failed:', err);
            }
        } else {
            console.warn('ApiLoader not found; skipping module load.');
        }

        // Wait briefly for APIs to initialize
        await new Promise(resolve => {
            let waited = 0;
            const checkInterval = setInterval(() => {
                if (window.apiService || window.gasAPI || window.appsAPI || window.newAppAPI || window.viewAppAPI) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (waited >= 3000) {
                    clearInterval(checkInterval);
                    resolve();
                } else {
                    waited += 100;
                }
            }, 100);
        });

        // Test connection if available
        if (window.apiService && typeof window.apiService.testConnection === 'function') {
            try {
                const testResult = await window.apiService.testConnection();
                console.log('API Connection Test:', testResult);
            } catch (err) {
                console.warn('apiService.testConnection failed:', err);
            }
        }

        return true;
    } catch (error) {
        console.error('Failed to initialize API:', error);
        return true;
    }
}

// ===== INITIALIZE ON LOAD =====
// In Main.js, update the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing application...');
  
  // Hide loading overlay when DOM is ready
  const loadingOverlay = document.getElementById('loading');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
  
  // Show main app container
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.classList.remove('hidden');
  }
  
  // Initialize date display
  updateCurrentDate();
  
  // Setup global event listeners
  setupGlobalEventListeners();
  
  // Initialize application tables
  initializeApplicationTables();
  
  console.log('Main.js initialized successfully');
});

function updateCurrentDate() {
  const dateDisplay = document.getElementById('current-date');
  if (dateDisplay) {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);
  }
}

// Emergency timeout
setTimeout(function() {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
        console.warn('Emergency: Forcing loading overlay to hide');
        loading.style.display = 'none';
    }
}, 3000);

// ===== AUTHENTICATION CHECK =====
function checkAuthentication() {
    const loggedInName = localStorage.getItem('loggedInName');
    const user = localStorage.getItem('user');

    if (!loggedInName && !user) {
        window.location.href = 'login/Login.html';
        return false;
    }
    return true;
}

function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }

        const loggedInName = localStorage.getItem('loggedInName');
        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');

        if (loggedInName) {
            return {
                fullName: loggedInName,
                role: userRole || 'User',
                userName: userName || loggedInName.toLowerCase().replace(/\s+/g, '.')
            };
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    return null;
}

// ===== LOADING OVERLAY MANAGEMENT =====
function showLoading(message = 'Loading...') {
    const loading = document.getElementById('loading');
    if (loading) {
        const p = loading.querySelector('p');
        if (p && message) p.textContent = message;
        loading.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== ELEMENT CACHING =====
function cacheElements() {
    const elements = {
        'logged-in-user': 'logged-in-user',
        'current-date': 'current-date',
        'loading': 'loading',
        'success-modal': 'success-modal',
        'success-message': 'success-message',
        'error-modal': 'error-modal',
        'error-message': 'error-message',
        'confirmation-modal': 'confirmation-modal',
        'confirmation-message': 'confirmation-message',
        'app-container': 'app-container',
        'main-content': 'main-content',
        'user-notification-badge': 'user-notification-badge',
        'new-count': 'new-count',
        'pending-count': 'pending-count',
        'pending-approvals-count': 'pending-approvals-count',
        'approved-count': 'approved-count'
    };

    for (const [key, id] of Object.entries(elements)) {
        cachedElements[key] = document.getElementById(id);
    }
}

function setLoggedInUser(name, role = '') {
    const userElement = document.getElementById('logged-in-user');
    if (userElement) {
        userElement.textContent = role ? `${name} (${role})` : name;
    }
}

function setupEventListeners() {
    console.log('Global event listeners setup in Main.js');
    // NOTE: Button handlers are now in button-handlers.js
}

// ===== DASHBOARD FUNCTIONS =====
function showDashboard() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'block';
    }
    showSection('new');
}

async function showSection(sectionId) {
    // Update active menu button
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.menu-btn[data-section="${sectionId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Load the section content
    await loadSectionContent(sectionId);
}

async function loadSectionContent(sectionId) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    showLoading('Loading content...');

    try {
        let htmlContent = '';
        let cssFile = '';
        let jsFile = '';

        switch(sectionId) {
            case 'new':
            case 'pending':
            case 'pending-approvals':
            case 'approved':
                htmlContent = await loadComponent('applications/AppsTables.html');
                cssFile = 'applications/AppsTables.css';
                jsFile = 'applications/AppsTables.js';
                break;

            case 'add-user':
            case 'users-list':
                htmlContent = await loadComponent('user-management/UserMgt.html');
                cssFile = 'user-management/UserMgt.css';
                jsFile = 'user-management/UserMgt.js';
                break;

            default:
                htmlContent = '<div class="error">Section not found</div>';
        }

        mainContent.innerHTML = htmlContent;

        // Load CSS if needed
        if (cssFile && !document.querySelector(`link[href="${cssFile}"]`)) {
            loadCSS(cssFile);
        }

        // Load and execute JS
        if (jsFile) {
            await loadJS(jsFile);

            // Initialize the loaded section
            if (sectionId.startsWith('add-user') || sectionId.startsWith('users-list')) {
                if (typeof initializeUserManagement === 'function') {
                    initializeUserManagement(sectionId);
                }
            } else {
                if (typeof initializeApplicationsSection === 'function') {
                    await initializeApplicationsSection(sectionId);
                }
            }
        }

        // Update badge counts for applications sections
        if (['new', 'pending', 'pending-approvals', 'approved'].includes(sectionId)) {
            await updateBadgeCounts();
        }

    } catch (error) {
        console.error('Error loading section:', error);
        mainContent.innerHTML = `<div class="error">Error loading section: ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

async function loadComponent(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading component:', error);
        throw error;
    }
}

function loadCSS(filePath) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = filePath;
    document.head.appendChild(link);
}

async function loadJS(filePath) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = filePath;
        script.onload = () => {
            console.log(`Loaded script: ${filePath}`);
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${filePath}`));
        document.body.appendChild(script);
    });
}

// ===== MODAL FUNCTIONS =====
function showSuccessModal(message) {
    if (cachedElements['success-message']) {
        cachedElements['success-message'].textContent = message;
    }
    if (cachedElements['success-modal']) {
        cachedElements['success-modal'].style.display = 'flex';
    }
}

function closeSuccessModal() {
    if (cachedElements['success-modal']) {
        cachedElements['success-modal'].style.display = 'none';
    }
}

function showErrorModal(message) {
    if (cachedElements['error-message']) {
        cachedElements['error-message'].textContent = message;
    }
    if (cachedElements['error-modal']) {
        cachedElements['error-modal'].style.display = 'flex';
    }
}

function closeErrorModal() {
    if (cachedElements['error-modal']) {
        cachedElements['error-modal'].style.display = 'none';
    }
}

function showConfirmationModal(message, callback) {
    if (cachedElements['confirmation-message']) {
        cachedElements['confirmation-message'].textContent = message;
    }
    if (cachedElements['confirmation-modal']) {
        cachedElements['confirmation-modal'].style.display = 'flex';
    }
    window.confirmationCallback = callback;
}

function closeConfirmationModal(confirmed) {
    if (cachedElements['confirmation-modal']) {
        cachedElements['confirmation-modal'].style.display = 'none';
    }

    if (window.confirmationCallback) {
        window.confirmationCallback(confirmed);
        window.confirmationCallback = null;
    }
}

// ===== APPLICATION FUNCTIONS =====
function logout() {
    showConfirmationModal('Are you sure you want to logout?', async (confirmed) => {
        if (confirmed) {
            showLoading('Logging out...');
            try {
                localStorage.clear();
                sessionStorage.clear();
                if (window.apiService && window.apiService.clearCache) {
                    window.apiService.clearCache();
                }
                hideLoading();
                window.location.href = 'login/Login.html';
            } catch (error) {
                hideLoading();
                window.location.href = 'login/Login.html';
            }
        }
    });
}

async function updateBadgeCounts() {
    try {
        const apiClient = window.apiService || window.gasAPI || window.appsAPI || window.newAppAPI || null;
        if (apiClient) {
            let result;
            if (typeof apiClient.getAllApplicationCounts === 'function') {
                result = await apiClient.getAllApplicationCounts();
            } else if (typeof apiClient.request === 'function') {
                result = await apiClient.request('getAllApplicationCounts');
            }

            if (result && result.success && result.data) {
                const counts = result.data;
                updateBadgeCount('new', counts.new || 0);
                updateBadgeCount('pending', counts.pending || 0);
                updateBadgeCount('pending-approvals', counts.pendingApprovals || 0);
                updateBadgeCount('approved', counts.approved || 0);
            } else if (result && typeof result === 'object' && ('new' in result || 'pending' in result)) {
                updateBadgeCount('new', result.new || 0);
                updateBadgeCount('pending', result.pending || 0);
                updateBadgeCount('pending-approvals', result.pendingApprovals || 0);
                updateBadgeCount('approved', result.approved || 0);
            }
        }
    } catch (error) {
        console.error('Error updating badge counts:', error);
        ['new', 'pending', 'pending-approvals', 'approved'].forEach(status => {
            updateBadgeCount(status, 0);
        });
    }
}

function updateBadgeCount(status, count) {
    const badgeElement = document.getElementById(status + '-count');
    if (badgeElement) {
        badgeElement.textContent = count;
        badgeElement.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function refreshApplications() {
    const activeSection = document.querySelector('.menu-btn.active');
    if (activeSection) {
        const section = activeSection.getAttribute('data-section');
        if (section) {
            showSection(section);
        }
    }
}

// ===== NOTIFICATIONS =====
function initializeBrowserNotifications() {
    if (!("Notification" in window)) {
        console.log('Browser notifications not supported');
        return;
    }

    switch (Notification.permission) {
        case "granted":
            setupNotificationListener();
            break;
        case "denied":
            console.log('Notifications denied by user');
            break;
        case "default":
            console.log('Notification permission not yet requested');
            break;
    }
}

function setupNotificationListener() {
    if (notificationCheckInterval) clearInterval(notificationCheckInterval);
    notificationCheckInterval = setInterval(function() {
        checkForNewApplications();
    }, 30000);
}

async function checkForNewApplications() {
    if (document.visibilityState !== 'visible') {
        try {
            const user = getCurrentUser();
            const apiClient = window.authAPI || window.appsAPI || window.apiService || window.gasAPI || null;
            if (user && apiClient && typeof apiClient.getApplicationsCountForUser === 'function') {
                const result = await apiClient.getApplicationsCountForUser(user.userName || user.fullName);
                const count = (result && result.success && result.data && result.data.count) ? result.data.count : (typeof result === 'number' ? result : (result && result.count) ? result.count : 0);

                if (count > lastAppCount) {
                    showApplicationNotification(user.fullName || user.name, user.role, count);
                    lastAppCount = count;
                }
            }
        } catch (error) {
            console.error('Error checking for new applications:', error);
        }
    }
}

function showApplicationNotification(userName, userRole, count) {
    if (Notification.permission === "granted" && document.visibilityState !== 'visible') {
        const notification = new Notification("New Application Assignment", {
            body: `${userName} has ${count} new application(s) for your action${userRole ? ` as ${userRole}` : ''}`,
            icon: "https://img.icons8.com/color/192/000000/loan.png",
            tag: "loan-application",
            requireInteraction: true
        });

        notification.onclick = function() {
            window.focus();
            notification.close();
            refreshApplications();
        };

        setTimeout(() => { notification.close(); }, 10000);
    }
}

// Main.js - Add this function
async function initializeApplicationTables() {
  console.log('Main.js: Initializing application tables...');
  
  // Wait for API to be ready
  if (window.apiReadyPromise) {
    try {
      const apiReady = await window.apiReadyPromise;
      console.log('Main.js: API ready status:', apiReady);
    } catch (error) {
      console.warn('Main.js: API initialization had issues:', error);
    }
  }
  
  // Wait a bit for DOM to be fully ready
  setTimeout(() => {
    console.log('Main.js: Checking for AppsTables functions...');
    
    // Check if AppsTables functions are available
    if (typeof window.populateTable === 'function') {
      console.log('Main.js: populateTable function found, initializing tables...');
      
      // Initialize tables with the correct IDs
      const tables = [
        { id: 'new-list', action: 'getNewApplications' },
        { id: 'pending-list', action: 'getPendingApplications' },
        { id: 'pending-approvals-list', action: 'getPendingApprovalApplications' },
        { id: 'approved-list', action: 'getApprovedApplications' }
      ];
      
      tables.forEach(table => {
        const element = document.getElementById(table.id);
        if (element) {
          console.log(`Main.js: Populating ${table.id} with ${table.action}`);
          window.populateTable(table.id, table.action, { showLoading: true });
        } else {
          console.warn(`Main.js: Table element not found: ${table.id}`);
        }
      });
    } else {
      console.error('Main.js: populateTable function not found!');
      console.log('Main.js: Available window functions:', Object.keys(window).filter(key => typeof window[key] === 'function'));
    }
  }, 1000);
}

// ===== MAKE FUNCTIONS GLOBALLY AVAILABLE =====
window.showSection = showSection;
window.refreshApplications = refreshApplications;
window.logout = logout;
window.showSuccessModal = showSuccessModal;
window.closeSuccessModal = closeSuccessModal;
window.showErrorModal = showErrorModal;
window.closeErrorModal = closeErrorModal;
window.showConfirmationModal = showConfirmationModal;
window.closeConfirmationModal = closeConfirmationModal;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

console.log('Main.js initialized successfully');
