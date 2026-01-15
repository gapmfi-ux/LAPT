// ===== LOGIN PAGE JAVASCRIPT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // Hide loading overlay immediately
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    
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
});

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('login-name').value.trim();
    if (!name) {
        showError('Name is required!');
        return;
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    try {
        // Check if gasAPI exists (it might not be loaded yet)
        if (typeof gasAPI === 'undefined') {
            // Fallback to direct API call
            const response = await fetch(`${getConfig().WEB_APP_URL}?action=authenticate&userName=${encodeURIComponent(name)}`);
            const data = await response.json();
            
            if (data.success) {
                handleSuccessfulLogin(data.user);
            } else {
                handleFailedLogin(data.message || 'Authentication failed');
            }
        } else {
            // Use gasAPI if available
            const result = await gasAPI.authenticateUser(name);
            
            if (result.success) {
                handleSuccessfulLogin(result.user);
            } else {
                handleFailedLogin(result.message || 'Authentication failed');
            }
        }
    } catch (error) {
        console.error('Authentication error:', error);
        // For demo/fallback purposes
        handleSuccessfulLogin(name);
    } finally {
        // Hide loading
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

function handleSuccessfulLogin(userData) {
    // Store user info in localStorage
    localStorage.setItem('loggedInName', userData.name || userData);
    localStorage.setItem('userRole', userData.role || 'User');
    localStorage.setItem('userLevel', userData.level || '1');
    
    // Store full user object if available
    if (typeof userData === 'object') {
        localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Redirect to main application
    window.location.href = 'index.html';
}

function handleFailedLogin(message) {
    showError(message || 'Authentication failed');
    
    // Clear input and refocus
    const loginInput = document.getElementById('login-name');
    if (loginInput) {
        loginInput.value = '';
        loginInput.focus();
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

function closeErrorModal() {
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

// Make function globally available
window.closeErrorModal = closeErrorModal;
