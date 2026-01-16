// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Login page loaded');
    
    // Hide loading overlay
    hideLoading();
    
    // Check if already logged in
    if (window.APP_STATE?.user) {
        redirectToDashboard();
        return;
    }
    
    // Initialize API
    await initializeLoginAPI();
    
    // Setup form submission
    const loginForm = document.getElementById('login-form');
    const loginInput = document.getElementById('login-name');
    
    if (loginForm && loginInput) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        
        // Focus on input
        setTimeout(() => {
            loginInput.focus();
        }, 100);
    }
    
    // Check for existing session
    checkExistingSession();
});

// ===== API INITIALIZATION =====
async function initializeLoginAPI() {
    try {
        // Load only required API modules
        await ApiLoader.loadWithDependencies(['api-auth']);
        console.log('Login API modules loaded');
    } catch (error) {
        console.error('Failed to load login API:', error);
        showLoginError('Failed to load authentication system. Please refresh the page.');
    }
}

// ===== LOGIN FUNCTIONS =====
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const userNameInput = document.getElementById('login-name');
    const userName = userNameInput.value.trim();
    
    if (!userName) {
        showLoginError('Please enter your name');
        userNameInput.focus();
        return;
    }
    
    showLoading('Authenticating...');
    
    try {
        // Use authAPI for login
        if (window.authAPI && window.authAPI.login) {
            const result = await window.authAPI.login(userName);
            
            if (result.success) {
                // Store user info in localStorage for backward compatibility
                localStorage.setItem('loggedInName', result.user.fullName);
                localStorage.setItem('userRole', result.user.role);
                localStorage.setItem('userName', result.user.userName);
                
                // Show success message
                showLoginSuccess(`Welcome back, ${result.user.fullName}!`);
                
                // Redirect to dashboard after delay
                setTimeout(() => {
                    redirectToDashboard();
                }, 1500);
            } else {
                hideLoading();
                showLoginError(result.message || 'Authentication failed');
            }
        } else {
            // Fallback to direct API call
            const result = await handleLegacyLogin(userName);
            if (result.success) {
                setTimeout(() => {
                    redirectToDashboard();
                }, 1500);
            } else {
                hideLoading();
                showLoginError(result.message);
            }
        }
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showLoginError(`Login failed: ${error.message}`);
    }
}

async function handleLegacyLogin(userName) {
    try {
        if (!window.gasAPI) {
            throw new Error('API not available');
        }
        
        // Authenticate user
        const authResult = await window.gasAPI.authenticateUser(userName);
        
        if (authResult.success) {
            const user = authResult.user;
            
            // Get permissions
            const permResult = await window.gasAPI.getUserPermissions(user.userName);
            const permissions = permResult.success ? permResult.data : {};
            
            // Update app state
            updateAppState('user', user);
            updateAppState('permissions', permissions);
            
            // Store in localStorage for backward compatibility
            localStorage.setItem('loggedInName', user.fullName);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userName', user.userName);
            
            showLoginSuccess(`Welcome back, ${user.fullName}!`);
            return { success: true, user };
        } else {
            return { success: false, message: authResult.message || 'Authentication failed' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

function checkExistingSession() {
    const loggedInName = localStorage.getItem('loggedInName');
    if (loggedInName) {
        const loginInput = document.getElementById('login-name');
        if (loginInput) {
            loginInput.value = loggedInName;
        }
    }
}

function redirectToDashboard() {
    window.location.href = 'index.html';
}

// ===== UI FUNCTIONS =====
function showLoginError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    if (errorModal) {
        errorModal.style.display = 'flex';
    }
}

function closeErrorModal() {
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

function showLoginSuccess(message) {
    // Show success message in the login form
    const loginHeader = document.querySelector('.login-header p');
    if (loginHeader) {
        const originalText = loginHeader.textContent;
        loginHeader.textContent = message;
        loginHeader.style.color = '#10b981';
        loginHeader.style.fontWeight = 'bold';
        
        setTimeout(() => {
            loginHeader.textContent = originalText;
            loginHeader.style.color = '';
            loginHeader.style.fontWeight = '';
        }, 1500);
    }
}

function showLoading(message) {
    const loading = document.getElementById('loading');
    if (loading) {
        const p = loading.querySelector('p');
        if (p) p.textContent = message;
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

// ===== MAKE FUNCTIONS GLOBALLY AVAILABLE =====
window.closeErrorModal = closeErrorModal;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
