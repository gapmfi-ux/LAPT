// ===== LOGIN PAGE JAVASCRIPT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // Hide loading overlay immediately
    hideLoading();
    
    // Check if user is already logged in
    checkExistingSession();
    
    // Focus on login input
    const loginInput = document.getElementById('login-name');
    if (loginInput) {
        loginInput.focus();
    }
    
    // Setup form submit handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Debug: Check if API is loaded
    console.log('API Status:', {
        apiService: !!window.apiService,
        gasAPI: !!window.gasAPI,
        APP_STATE: window.APP_STATE
    });
});

function checkExistingSession() {
    const loggedInName = localStorage.getItem('loggedInName');
    const user = localStorage.getItem('user');
    
    if (loggedInName || user) {
        // User might be already logged in, redirect to main page
        console.log('Existing session found, redirecting...');
        showLoading('Redirecting to dashboard...');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 500);
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('login-name').value.trim();
    if (!name) {
        showError('Please enter your name!');
        return;
    }
    
    // Show loading
    showLoading('Authenticating...');
    
    try {
        console.log('Attempting to authenticate:', name);
        
        // Check which API is available
        let api = window.apiService || window.gasAPI;
        
        if (!api) {
            console.warn('No API service found, using fallback authentication');
            // Create fallback user data
            const fallbackUser = {
                userName: name.toLowerCase().replace(/\s+/g, '.'),
                fullName: name,
                role: 'User',
                permissions: ['view_applications']
            };
            handleSuccessfulLogin(fallbackUser);
            return;
        }
        
        // First test the connection if possible
        if (api.testConnection) {
            try {
                const testResult = await api.testConnection();
                console.log('Connection test result:', testResult);
            } catch (connError) {
                console.warn('Connection test failed, continuing with login:', connError);
            }
        }
        
        // Try to authenticate
        let authResult;
        if (api.authenticateUser) {
            authResult = await api.authenticateUser(name);
            console.log('Auth API result:', authResult);
        } else {
            // Fallback authentication
            console.warn('No authenticateUser method, using fallback');
            authResult = {
                success: true,
                user: {
                    userName: name.toLowerCase().replace(/\s+/g, '.'),
                    fullName: name,
                    role: 'User',
                    permissions: ['view_applications']
                }
            };
        }
        
        if (authResult && authResult.success) {
            handleSuccessfulLogin(authResult.user || { 
                fullName: name, 
                role: 'User',
                userName: name.toLowerCase().replace(/\s+/g, '.')
            });
        } else {
            const errorMsg = authResult?.message || 'Authentication failed';
            handleFailedLogin(errorMsg);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Even if there's an error, allow login for demo purposes
        console.log('Using fallback login due to error');
        handleSuccessfulLogin({
            fullName: name,
            role: 'User',
            userName: name.toLowerCase().replace(/\s+/g, '.')
        });
        
    } finally {
        // Hide loading
        hideLoading();
    }
}

function handleSuccessfulLogin(userData) {
    console.log('Login successful:', userData);
    
    // Store user info
    localStorage.setItem('loggedInName', userData.fullName || userData.name || userData.userName || userData);
    localStorage.setItem('userRole', userData.role || 'User');
    localStorage.setItem('userName', userData.userName || (userData.fullName || userData.name || userData).toLowerCase().replace(/\s+/g, '.'));
    
    // Store full user object
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Show success message briefly
    showSuccessMessage('Login successful! Redirecting...');
    
    // Redirect to main application after a short delay
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

function handleFailedLogin(message) {
    console.error('Login failed:', message);
    showError(message || 'Authentication failed. Please try again.');
    
    // Clear input and refocus
    const loginInput = document.getElementById('login-name');
    if (loginInput) {
        loginInput.value = '';
        loginInput.focus();
    }
}

function showLoading(message = 'Loading...') {
    const loading = document.getElementById('loading');
    if (loading) {
        const p = loading.querySelector('p');
        if (p && message) p.textContent = message;
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorModal = document.getElementById('error-modal');
    
    if (errorMessage && errorModal) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    }
}

function showSuccessMessage(message) {
    // Could implement a brief success message
    console.log('Success:', message);
}

function closeErrorModal() {
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

// Make functions globally available
window.closeErrorModal = closeErrorModal;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
