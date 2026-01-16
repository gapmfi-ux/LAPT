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
        // Load all required API modules
        await ApiLoader.loadAll();
        console.log('API modules loaded successfully');
        return true;
    } catch (error) {
        console.error('Failed to load API modules:', error);
        showErrorModal(`Failed to load application modules: ${error.message}`);
        return false;
    }
}

// ===== INITIALIZE ON LOAD =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing application...');
    
    // Immediately hide the loading overlay
    hideLoading();
    
    // Initialize API
    const apiInitialized = await initializeAPI();
    if (!apiInitialized) {
        return;
    }
    
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Cache elements
    cacheElements();
    
    // Set current user display
    const user = window.APP_STATE?.user;
    if (user) {
        setLoggedInUser(user.fullName, user.role);
    } else {
        // Fallback to localStorage
        const loggedInName = localStorage.getItem('loggedInName');
        const userRole = localStorage.getItem('userRole');
        setLoggedInUser(loggedInName, userRole);
    }
    
    // Set current date
    if (cachedElements['current-date']) {
        cachedElements['current-date'].textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
    
    // Show dashboard
    showDashboard();
    
    // Initialize browser notifications
    initializeBrowserNotifications();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update welcome stats
    await updateWelcomeStats();
    
    // Test API connection
    testAPIConnection();
});

// Emergency timeout
setTimeout(function() {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
        console.warn('Emergency: Forcing loading overlay to hide');
        loading.style.display = 'none';
    }
}, 3000);

// ===== API CONNECTION TEST =====
async function testAPIConnection() {
    try {
        if (window.gasAPI && window.gasAPI.testConnection) {
            const testResult = await window.gasAPI.testConnection();
            console.log('API Connection Test:', testResult);
            
            if (!testResult.connected) {
                console.warn('API connection issues detected');
            }
        }
    } catch (error) {
        console.error('API connection test failed:', error);
    }
}

// ===== AUTHENTICATION CHECK =====
function checkAuthentication() {
    // Check if user is authenticated via API state
    if (window.APP_STATE?.user) {
        return true;
    }
    
    // Fallback to localStorage
    const loggedInName = localStorage.getItem('loggedInName');
    if (!loggedInName) {
        // Redirect to login page
        window.location.href = 'login.html';
        return false;
    }
    return true;
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
        'approved-count': 'approved-count',
        'welcome-new-count': 'welcome-new-count',
        'welcome-pending-count': 'welcome-pending-count',
        'welcome-pending-approvals-count': 'welcome-pending-approvals-count',
        'welcome-approved-count': 'welcome-approved-count'
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
    // Setup any global event listeners here
}

// ===== DASHBOARD FUNCTIONS =====
function showDashboard() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'block';
    }
    
    // Load default section
    showSection('new');
}

async function showSection(sectionId) {
    // Update active menu button
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.menu-btn[onclick*="showSection('${sectionId}')"]`);
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
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
    }
    return await response.text();
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
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${filePath}`));
        document.body.appendChild(script);
    });
}

// ===== WELCOME STATS =====
async function updateWelcomeStats() {
    try {
        if (!window.gasAPI || !window.gasAPI.getAllApplicationCounts) {
            console.warn('API not available for stats');
            return;
        }
        
        const result = await window.gasAPI.getAllApplicationCounts();
        
        if (result && result.success && result.data) {
            const counts = result.data;
            
            // Update welcome stats
            const elements = {
                'welcome-new-count': counts.new || 0,
                'welcome-pending-count': counts.pending || 0,
                'welcome-pending-approvals-count': counts.pendingApprovals || 0,
                'welcome-approved-count': counts.approved || 0
            };
            
            for (const [id, count] of Object.entries(elements)) {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = count;
                }
            }
            
            // Update sidebar badges
            const badgeElements = {
                'new-count': counts.new || 0,
                'pending-count': counts.pending || 0,
                'pending-approvals-count': counts.pendingApprovals || 0,
                'approved-count': counts.approved || 0
            };
            
            for (const [id, count] of Object.entries(badgeElements)) {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = count;
                    element.style.display = count > 0 ? 'inline-block' : 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
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
    // Store callback for confirmation
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
function showNewApplicationModal() {
    showLoading('Preparing new application...');
    
    if (window.gasAPI && window.gasAPI.getNewApplicationContext) {
        window.gasAPI.getNewApplicationContext()
            .then(result => {
                hideLoading();
                if (result.success) {
                    // Open new application modal with context
                    alert(`New Application Modal - Context loaded. Next app number: ${result.data.nextAppNumber}`);
                } else {
                    showErrorModal('Failed to load new application context');
                }
            })
            .catch(error => {
                hideLoading();
                showErrorModal(`Error: ${error.message}`);
            });
    } else {
        hideLoading();
        alert('New Application Modal - API not available');
    }
}

async function logout() {
    showConfirmationModal('Are you sure you want to logout?', async (confirmed) => {
        if (confirmed) {
            showLoading('Logging out...');
            
            try {
                // Use authAPI logout if available
                if (window.authAPI && window.authAPI.logout) {
                    await window.authAPI.logout();
                }
                
                // Clear stored data
                localStorage.clear();
                sessionStorage.clear();
                
                // Clear API cache
                if (window.apiCache) {
                    window.apiCache.clear();
                }
                
                hideLoading();
                
                // Redirect to login page
                window.location.href = 'login.html';
            } catch (error) {
                hideLoading();
                console.error('Error during logout:', error);
                // Still redirect to login
                window.location.href = 'login.html';
            }
        }
    });
}

function updateBadgeCount(status, count) {
    const badgeElement = document.getElementById(status + '-count');
    if (badgeElement) {
        badgeElement.textContent = count;
        badgeElement.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

async function updateBadgeCounts() {
    try {
        if (window.gasAPI && window.gasAPI.getAllApplicationCounts) {
            const result = await window.gasAPI.getAllApplicationCounts();
            if (result && result.success && result.data) {
                const counts = result.data;
                updateBadgeCount('new', counts.new || 0);
                updateBadgeCount('pending', counts.pending || 0);
                updateBadgeCount('pending-approvals', counts.pendingApprovals || 0);
                updateBadgeCount('approved', counts.approved || 0);
            }
        }
    } catch (error) {
        console.error('Error updating badge counts:', error);
    }
}

// ===== NOTIFICATIONS =====
function updateUserNotificationBadge() {
    // This would be implemented with actual notification data
    const count = 0; // Placeholder
    const badge = cachedElements['user-notification-badge'];
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function initializeBrowserNotifications() {
    if (!("Notification" in window)) return;
    
    switch (Notification.permission) {
        case "granted":
            setupNotificationListener();
            break;
        case "denied":
            console.log('Notifications denied by user');
            break;
        case "default":
            Notification.requestPermission().then(permission => {
                if (permission === "granted") setupNotificationListener();
            });
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
            const user = window.APP_STATE?.user;
            if (user && window.gasAPI && window.gasAPI.getApplicationsCountForUser) {
                const result = await window.gasAPI.getApplicationsCountForUser(user.userName);
                if (result && result.success && result.data) {
                    const count = result.data.count || 0;
                    
                    if (count > lastAppCount) {
                        showApplicationNotification(user.fullName, user.role, count);
                        lastAppCount = count;
                    }
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

function refreshApplications() {
    const activeSection = document.querySelector('.menu-btn.active');
    if (activeSection) {
        const onclickAttr = activeSection.getAttribute('onclick');
        const match = onclickAttr.match(/showSection\('([^']+)'\)/);
        if (match) {
            showSection(match[1]);
        }
    }
}

// ===== MAKE FUNCTIONS GLOBALLY AVAILABLE =====
window.showSection = showSection;
window.refreshApplications = refreshApplications;
window.logout = logout;
window.showNewApplicationModal = showNewApplicationModal;
window.showSuccessModal = showSuccessModal;
window.closeSuccessModal = closeSuccessModal;
window.showErrorModal = showErrorModal;
window.closeErrorModal = closeErrorModal;
window.showConfirmationModal = showConfirmationModal;
window.closeConfirmationModal = closeConfirmationModal;
window.updateWelcomeStats = updateWelcomeStats;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
