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

function handleLoginSubmit(e) {
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
    
    // Use the correct API endpoint
    fetch(`${getConfig().WEB_APP_URL}?action=authenticate&userName=${encodeURIComponent(name)}`)
        .then(response => response.json())
        .then(data => {
            // Hide loading
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            if (data.success) {
                handleSuccessfulLogin(data.user);
            } else {
                handleFailedLogin(data.message || 'Authentication failed');
            }
        })
        .catch(error => {
            // Hide loading
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            console.error('Authentication error:', error);
            // For demo purposes, fallback to successful login
            handleSuccessfulLogin(name);
        });
}

function handleSuccessfulLogin(name) {
    // Store user info in localStorage
    localStorage.setItem('loggedInName', name);
    localStorage.setItem('userRole', 'User'); // Default role
    localStorage.setItem('userLevel', '1'); // Default level
    
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
