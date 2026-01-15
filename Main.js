// ----------- GLOBAL VARIABLES -----------
const cachedElements = {};
let currentAppNumber = "";
let currentAppFolderId = "";
let lastAppCount = 0;
let notificationCheckInterval;
let refreshInterval;
let currentViewingAppData = null;

// ----------- INITIALIZATION -----------
function initializeApp() {
    console.log('Loan Application Tracker initialized');
    
    // FORCE HIDE LOADING OVERLAY - Add this line
function forceHideLoading() {
    // Hide ALL loading overlays
    const loadingElements = document.querySelectorAll('.loading-overlay, #loading, #loading-overlay');
    loadingElements.forEach(element => {
        element.style.display = 'none';
    });
    
    // Show app container
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.classList.remove('hidden');
    }
}    
    cacheElements();
    
    // Hide loading overlay
function hideLoading() {
    forceHideLoading(); // Use the new function
    
    // Additional cleanup if needed
    document.body.style.overflow = 'auto';
}
    // Set current date
    if (cachedElements['current-date']) {
        cachedElements['current-date'].textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
    
    // Check authentication
    const loggedInName = localStorage.getItem('loggedInName');
    if (!loggedInName) {
        showLoginModal();
    } else {
        verifyUserOnLoad(loggedInName);
    }
    
    // Initialize browser notifications
    initializeBrowserNotifications();
    
    // Setup event listeners
    setupEventListeners();
}
function cacheElements() {
    const elements = {
        'login-modal': 'login-modal',
        'logged-in-user': 'logged-in-user',
        'current-date': 'current-date',
        'loading': 'loading',
        'success-modal': 'success-modal',
        'success-message': 'success-message',
        'app-container': 'app-container',
        'main-content': 'main-content',
        'user-notification-badge': 'user-notification-badge'
    };
    
    for (const [key, id] of Object.entries(elements)) {
        cachedElements[key] = document.getElementById(id);
    }
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Add user form
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUserSubmit);
    }
}

// ----------- AUTHENTICATION -----------
function verifyUserOnLoad(loggedInName) {
    showLoading();
    
    gasAPI.authenticateUser(loggedInName)
        .then(function(authResult) {
            hideLoading();
            if (authResult.success) {
                const userRole = localStorage.getItem('userRole');
                setLoggedInUser(loggedInName, userRole);
                hideLoginModal();
                showDashboard();
                initializeAndRefreshTables();
                initializeAppCount();
            } else {
                localStorage.removeItem('loggedInName');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userLevel');
                showLoginModal();
            }
        })
        .catch(function(error) {
            hideLoading();
            console.error('Authentication error:', error);
            localStorage.removeItem('loggedInName');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userLevel');
            showLoginModal();
        });
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    if (!name) {
        alert('Name is required!');
        return;
    }
    
    showLoading();
    
    gasAPI.authenticateUser(name)
        .then(function(authResult) {
            hideLoading();
            if (authResult.success) {
                handleSuccessfulLogin(name, authResult.user);
            } else {
                handleFailedLogin(authResult.message);
            }
        })
        .catch(function(error) {
            hideLoading();
            alert('Login error: ' + error.message);
            document.getElementById('login-name').value = '';
            document.getElementById('login-name').focus();
        });
}

function handleSuccessfulLogin(name, user) {
    localStorage.setItem('loggedInName', name);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userLevel', user.level);
    setLoggedInUser(name, user.role);
    hideLoginModal();
    showDashboard();
    initializeAndRefreshTables();
    initializeBrowserNotifications();
    initializeAppCount();
}

function handleFailedLogin(message) {
    alert(message || 'Authentication failed');
    document.getElementById('login-name').value = '';
    document.getElementById('login-name').focus();
}

function setLoggedInUser(name, role = '') {
    const userElement = cachedElements['logged-in-user'];
    if (userElement) {
        userElement.textContent = role ? `${name} (${role})` : name;
    }
    updateUserNotificationBadge();
}

function showLoginModal() {
    if (cachedElements['login-modal']) {
        cachedElements['login-modal'].style.display = 'flex';
    }
    if (cachedElements['app-container']) {
        cachedElements['app-container'].classList.add('hidden');
    }
}

function hideLoginModal() {
    if (cachedElements['login-modal']) {
        cachedElements['login-modal'].style.display = 'none';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userLevel');
        clearIntervals();
        showLoginModal();
    }
}

function restrictIfNotLoggedIn() {
    const loggedInName = localStorage.getItem('loggedInName');
    if (!loggedInName) {
        showLoginModal();
        return true;
    }
    return false;
}

// ----------- DASHBOARD -----------
function showDashboard() {
    if (cachedElements['app-container']) {
        cachedElements['app-container'].classList.remove('hidden');
    }
    
    // Load default section
    showSection('new');
}

async function showSection(sectionId) {
    if (restrictIfNotLoggedIn()) return;
    
    // Update active menu button
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.menu-btn[onclick*="showSection('${sectionId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Load the section content
    await loadSectionContent(sectionId);
}

async function loadSectionContent(sectionId) {
    const mainContent = cachedElements['main-content'];
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

// ----------- APPLICATION LOGIC -----------
function startNewApplication() {
    gasAPI.getNewApplicationContext()
        .then(function(ctx) {
            currentAppNumber = ctx.appNumber;
            currentAppFolderId = ctx.folderId;
        })
        .catch(function(error) {
            console.error('Error starting new application:', error);
            alert('Error starting new application: ' + error.message);
        });
}

function downloadLendingTemplate() {
    if (!currentAppNumber || !currentAppFolderId) {
        alert("Application number/folder not set.");
        return;
    }
    
    showLoading();
    
    gasAPI.copyLendingTemplate(currentAppNumber, currentAppFolderId)
        .then(function(url) {
            hideLoading();
            window.open(url, '_blank');
        })
        .catch(function(error) {
            hideLoading();
            alert('Error downloading template: ' + error.message);
        });
}

// ----------- TABLE FUNCTIONS -----------
function updateBadgeCount(status, count) {
    const badgeElement = document.getElementById(status + '-count');
    if (badgeElement) {
        badgeElement.textContent = count;
        badgeElement.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function updateBadgeCounts() {
    gasAPI.getAllApplicationCounts()
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

function initializeAndRefreshTables() {
    // Initial load
    updateBadgeCounts();
    updateUserNotificationBadge();
    
    // Set up auto-refresh
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(function() {
        updateBadgeCounts();
        updateUserNotificationBadge();
    }, 60000);
}

// ----------- APPLICATION CLICK HANDLER -----------
function handleAppNumberClick(appNumber) {
    if (!appNumber || appNumber === 'undefined' || appNumber === 'null') {
        alert('Error: Invalid application number');
        return;
    }
    
    const userName = localStorage.getItem('loggedInName');
    showLoading();
    
    gasAPI.getApplicationDetails(appNumber, userName)
        .then(function(response) {
            hideLoading();
            if (response && response.success && response.data) {
                const appData = response.data;
                currentViewingAppData = appData;
                
                if (appData.status === 'NEW' && appData.completionStatus === 'DRAFT') {
                    // Open in edit mode
                    showNewApplicationModal(appNumber);
                } else {
                    // Open in view mode
                    openViewApplicationModal(appData);
                }
            } else {
                alert('Failed to load application: ' + (response?.message || 'Application not found'));
            }
        })
        .catch(function(error) {
            hideLoading();
            if (error?.message?.includes('Application not found')) {
                alert('Application not found: ' + appNumber + '. Please try refreshing the list.');
            } else if (error?.message?.includes('not authorized')) {
                alert('You are not authorized to view this application.');
            } else {
                alert('Error loading application details: ' + (error?.message || error));
            }
        });
}

// ----------- USER MANAGEMENT -----------
function handleAddUserSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('new-user-name')?.value.trim();
    const level = document.getElementById('new-user-level')?.value;
    const role = document.getElementById('new-user-role')?.value;
    
    if (!name || !level || !role) {
        alert('Please fill all fields!');
        return;
    }
    
    const userData = { name, level: parseInt(level), role };
    
    gasAPI.addUser(userData)
        .then(function(res) {
            showSuccessModal(res.message || 'User added!');
            if (res.success) {
                document.getElementById('add-user-form').reset();
                showSection('users-list');
            }
        })
        .catch(function(error) {
            alert('Error adding user: ' + error.message);
        });
}

function deleteUser(userName) {
    if (!confirm('Are you sure you want to delete user: ' + userName + '?')) return;
    
    gasAPI.deleteUser(userName)
        .then(function(res) {
            showSuccessModal(res.message || 'User deleted!');
            if (res.success) {
                refreshUsersList();
            }
        })
        .catch(function(error) {
            alert('Error deleting user: ' + error.message);
        });
}

function refreshUsersList() {
    if (typeof window.refreshUsersList === 'function') {
        window.refreshUsersList();
    }
}

// ----------- NOTIFICATIONS -----------
function updateUserNotificationBadge() {
    const userName = localStorage.getItem('loggedInName');
    if (!userName) return;
    
    gasAPI.getApplicationsCountForUser(userName)
        .then(function(count) {
            const badge = cachedElements['user-notification-badge'];
            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        })
        .catch(function(error) {
            console.error('Error updating badge:', error);
        });
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
    const userName = localStorage.getItem('loggedInName');
    if (!userName || document.visibilityState === 'visible') return;
    
    gasAPI.getApplicationsCountForUser(userName)
        .then(function(currentCount) {
            const previousCount = lastAppCount;
            lastAppCount = currentCount;
            if (currentCount > previousCount && previousCount > 0) {
                const newCount = currentCount - previousCount;
                const userRole = localStorage.getItem('userRole') || '';
                showApplicationNotification(userName, userRole, newCount);
            }
        })
        .catch(function(error) {
            console.error('Error checking applications:', error);
        });
}

function showApplicationNotification(userName, userRole, count) {
    if (Notification.permission === "granted" && document.visibilityState !== 'visible') {
        const notification = new Notification("New Application Assignment", {
            body: `${userName} have ${count} application(s) for your action${userRole ? ` as ${userRole}` : ''}`,
            icon: "https://img.icons8.com/color/192/000000/loan.png",
            badge: "https://img.icons8.com/color/192/000000/loan.png",
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

function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        refreshApplications();
        updateUserNotificationBadge();
    } else {
        const userName = localStorage.getItem('loggedInName');
        if (userName) {
            gasAPI.getApplicationsCountForUser(userName)
                .then(function(count) {
                    lastAppCount = count;
                })
                .catch(console.error);
        }
    }
}

function initializeAppCount() {
    const userName = localStorage.getItem('loggedInName');
    if (userName) {
        gasAPI.getApplicationsCountForUser(userName)
            .then(function(count) {
                lastAppCount = count;
            })
            .catch(console.error);
    }
}

// ----------- UTILITY FUNCTIONS -----------
function showLoading() {
    if (cachedElements['loading']) {
        cachedElements['loading'].style.display = 'flex';
    }
}

function hideLoading() {
    if (cachedElements['loading']) {
        cachedElements['loading'].style.display = 'none';
    }
}

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

function clearIntervals() {
    if (notificationCheckInterval) clearInterval(notificationCheckInterval);
    if (refreshInterval) clearInterval(refreshInterval);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const format = {
    date: date => date ? new Date(date).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'}) : '',
    currency: amount => {
        if (amount === null || amount === undefined) return '0.00';
        const num = parseFloat(amount);
        return isNaN(num) ? '0.00' : num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
};

// ----------- MODAL FUNCTIONS -----------
function showNewApplicationModal(appNumber = null) {
    alert('New application modal would open here');
    // You would load the new application modal HTML/JS here
}

function openViewApplicationModal(appData) {
    alert('View application modal would open here');
    // You would load the view application modal HTML/JS here
}

function closeViewApplicationModal() {
    // Implementation for closing view modal
}

// ----------- INITIALIZE ON LOAD -----------
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Make functions globally available
window.showSection = showSection;
window.refreshApplications = refreshApplications;
window.refreshUsersList = refreshUsersList;
window.logout = logout;
window.handleAppNumberClick = handleAppNumberClick;
window.deleteUser = deleteUser;
window.closeSuccessModal = closeSuccessModal;
window.showNewApplicationModal = showNewApplicationModal;
window.closeViewApplicationModal = closeViewApplicationModal;
window.format = format;
window.escapeHtml = escapeHtml;
