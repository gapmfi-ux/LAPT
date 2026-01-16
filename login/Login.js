// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Login page loaded');
    
    // Hide loading overlay initially
    hideLoading();
    
    // Check if already logged in
    if (window.APP_STATE?.user) {
        redirectToDashboard();
        return;
    }
    
    // Setup form submission first
    setupLoginForm();
    
    // Then initialize API
    await initializeLoginAPI();
    
    // Check for existing session
    checkExistingSession();
});

// ===== FORM SETUP =====
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const loginInput = document.getElementById('login-name');
    
    if (loginForm && loginInput) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        
        // Focus on input
        setTimeout(() => {
            loginInput.focus();
        }, 100);
    }
}

// ===== API INITIALIZATION =====
async function initializeLoginAPI() {
    try {
        // Load only required API modules for login
        console.log('Starting API initialization...');
        
        // First load the core API
        await loadScript('../api/api-core.js');
        
        // Then load auth API
        await loadScript('../api/api-auth.js');
        
        console.log('Login API modules loaded successfully');
        return true;
    } catch (error) {
        console.error('Failed to load login API:', error);
        showLoginError('Failed to load authentication system. Please refresh the page.');
        return false;
    }
}

// ===== LOAD SCRIPT HELPER =====
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            console.log(`Script already loaded: ${src}`);
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`Loaded: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`Failed to load: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.body.appendChild(script);
    });
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
        // Check what API methods are available
        console.log('Available APIs:', {
            authAPI: !!window.authAPI,
            gasAPI: !!window.gasAPI,
            makeJsonpRequest: !!window.makeJsonpRequest
        });
        
        // Try authAPI.login first
        if (window.authAPI && window.authAPI.login) {
            console.log('Using authAPI.login');
            const result = await window.authAPI.login(userName);
            
            if (result.success) {
                handleLoginSuccess(result.user);
            } else {
                handleLoginFailure(result.message);
            }
        }
        // Try gasAPI.authenticateUser
        else if (window.gasAPI && window.gasAPI.authenticateUser) {
            console.log('Using gasAPI.authenticateUser');
            const result = await handleLegacyLogin(userName);
            if (result.success) {
                handleLoginSuccess(result.user);
            } else {
                handleLoginFailure(result.message);
            }
        }
        // Try direct makeJsonpRequest
        else if (window.makeJsonpRequest) {
            console.log('Using direct makeJsonpRequest');
            const result = await handleDirectLogin(userName);
            if (result.success) {
                handleLoginSuccess(result.user);
            } else {
                handleLoginFailure(result.message);
            }
        }
        else {
            handleLoginFailure('Authentication system not available. Please refresh the page.');
        }
    } catch (error) {
        handleLoginFailure(`Login failed: ${error.message}`);
    }
}

// ===== LOGIN HANDLERS =====
async function handleLegacyLogin(userName) {
    try {
        const authResult = await window.gasAPI.authenticateUser(userName);
        
        if (authResult.success) {
            const user = authResult.user;
            
            // Get permissions if method exists
            let permissions = {};
            if (window.gasAPI.getUserPermissions) {
                const permResult = await window.gasAPI.getUserPermissions(user.userName);
                if (permResult.success) {
                    permissions = permResult.data;
                }
            }
            
            // Update app state
            if (window.updateAppState) {
                updateAppState('user', user);
                updateAppState('permissions', permissions);
            }
            
            // Store in localStorage for backward compatibility
            localStorage.setItem('loggedInName', user.fullName);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userName', user.userName);
            
            return { success: true, user };
        } else {
            return { success: false, message: authResult.message || 'Authentication failed' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleDirectLogin(userName) {
    try {
        // Direct API call using makeJsonpRequest
        const authResult = await makeJsonpRequest('authenticate', { userName: userName });
        
        if (authResult.success) {
            const user = authResult.user;
            
            // Store in localStorage
            localStorage.setItem('loggedInName', user.fullName);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userName', user.userName);
            
            return { success: true, user };
        } else {
            return { success: false, message: authResult.message || 'Authentication failed' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

function handleLoginSuccess(user) {
    console.log('Login successful:', user);
    
    // Show success message
    showLoginSuccess(`Welcome back, ${user.fullName}!`);
    
    // Redirect to dashboard after delay
    setTimeout(() => {
        redirectToDashboard();
    }, 1500);
}

function handleLoginFailure(message) {
    hideLoading();
    console.error('Login failed:', message);
    showLoginError(message || 'Authentication failed');
}

// ===== SESSION MANAGEMENT =====
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
    hideLoading();
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
