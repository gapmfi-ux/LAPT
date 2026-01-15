// ===== GLOBAL VARIABLES =====
const cachedElements = {};
let currentAppNumber = "";
let currentAppFolderId = "";
let lastAppCount = 0;
let notificationCheckInterval;
let refreshInterval;
let currentViewingAppData = null;

// ===== LOADING OVERLAY MANAGEMENT =====
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
        // Add body class to prevent scrolling
        document.body.style.overflow = 'hidden';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
        loading.classList.add('hidden');
        // Restore body scrolling
        document.body.style.overflow = 'auto';
    }
}

function forceHideAllLoadingOverlays() {
    // Hide ALL possible loading overlays
    const loadingElements = document.querySelectorAll('#loading, .loading-overlay');
    loadingElements.forEach(element => {
        element.style.display = 'none';
        element.classList.add('hidden');
    });
    
    // Ensure app container is visible
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'block';
    }
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
}

// ===== INITIALIZATION =====
function initializeApp() {
    console.log('Loan Application Tracker initialized');
    
    // FORCE HIDE ANY LINGERING LOADING OVERLAY IMMEDIATELY
    forceHideAllLoadingOverlays();
    
    cacheElements();
    
    // Set current date
    if (cachedElements['current-date']) {
        cachedElements['current-date'].textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
    
    // Show dashboard immediately (no login required)
    showDashboard();
    
    // Initialize browser notifications
    initializeBrowserNotifications();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update welcome stats
    updateWelcomeStats();
}

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
    
    showLoading();
    
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
                    initializeApplicationsSection(sectionId);
                }
            }
        }
        
        // Update badge counts for applications sections
        if (['new', 'pending', 'pending-approvals', 'approved'].includes(sectionId)) {
            updateBadgeCounts();
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
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// ===== WELCOME STATS =====
async function updateWelcomeStats() {
    try {
        // Simulate API call - replace with actual API call
        const counts = await getAllApplicationCounts();
        
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
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Simulated API function - replace with actual API
async function getAllApplicationCounts() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                new: 5,
                pending: 12,
                pendingApprovals: 3,
                approved: 25
            });
        }, 500);
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
    alert('New Application Modal - This would open a modal for creating a new application');
    // Implement modal opening logic here
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Show success message
        showSuccessModal('Logged out successfully!');
        
        // Reload page after a delay
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}

function updateBadgeCount(status, count) {
    const badgeElement = document.getElementById(status + '-count');
    if (badgeElement) {
        badgeElement.textContent = count;
        badgeElement.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function updateBadgeCounts() {
    getAllApplicationCounts()
        .then(function(counts) {
            updateBadgeCount('new', counts.new);
            updateBadgeCount('pending', counts.pending);
            updateBadgeCount('pending-approvals', counts.pendingApprovals);
            updateBadgeCount('approved', counts.approved);
        })
        .catch(function(error) {
            console.error('Error updating badge counts:', error);
        });
}

// ===== NOTIFICATIONS =====
function updateUserNotificationBadge() {
    // Simulate getting notification count
    const count = Math.floor(Math.random() * 10);
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

function checkForNewApplications() {
    // Simulate checking for new applications
    if (document.visibilityState !== 'visible') {
        const userName = "Current User";
        const userRole = "User";
        const count = Math.floor(Math.random() * 3);
        
        if (count > 0) {
            showApplicationNotification(userName, userRole, count);
        }
    }
}

function showApplicationNotification(userName, userRole, count) {
    if (Notification.permission === "granted" && document.visibilityState !== 'visible') {
        const notification = new Notification("New Application Assignment", {
            body: `${userName} have ${count} application(s) for your action${userRole ? ` as ${userRole}` : ''}`,
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

// ===== INITIALIZE ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Force hide loading overlay immediately
    forceHideAllLoadingOverlays();
    
    // Add class to body to fix loading overlay
    document.body.classList.add('loading-fixed');
    
    // Initialize application
    initializeApp();
});

// Also hide loading when window fully loads (as backup)
window.addEventListener('load', function() {
    console.log('Window loaded, ensuring loading is hidden');
    
    // Final safety: remove any remaining loading overlays
    forceHideAllLoadingOverlays();
    
    // Ensure app container is visible
    const appContainer = document.getElementById('app-container');
    if (appContainer && appContainer.classList.contains('hidden')) {
        appContainer.classList.remove('hidden');
    }
    
    // Mark as loaded
    document.body.classList.add('loading-fixed');
});

// Emergency timeout to ensure loading overlay disappears
setTimeout(function() {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
        console.warn('Emergency: Forcing loading overlay to hide');
        forceHideAllLoadingOverlays();
    }
}, 5000); // 5 second emergency timeout

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
