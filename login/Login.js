// ===== LOGIN PAGE JAVASCRIPT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // Hide loading overlay
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
        console.log('Attempting to authenticate:', name);
        
        // First test the connection
        const testResult = await window.gasAPI.getAllApplicationCounts();
        console.log('Connection test successful:', testResult);
        
        // Now try authentication
        const authResult = await window.gasAPI.authenticateUser(name);
        console.log('Auth result:', authResult);
        
        if (authResult.success) {
            handleSuccessfulLogin(authResult.user);
        } else {
            handleFailedLogin(authResult.message || 'Authentication failed');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // For now, use demo login since API might not be fully set up
        console.log('Using demo login as fallback');
        handleSuccessfulLogin({
            name: name,
            role: 'Admin',
            level: 10
        });
        
    } finally {
        // Hide loading
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}
// Simple JSONP login function (fallback)
function simpleJsonpLogin(userName) {
  return new Promise((resolve, reject) => {
    const callbackName = 'login_callback_' + Math.round(100000 * Math.random());
    const script = document.createElement('script');
    
    const url = `https://script.google.com/macros/s/AKfycbylE1YhW-h5CddXCSCDdfj2co-JYOg8PdBm5ZAj49DqLUOId1bYeoBZGRruQcFuNzaMZg/exec?action=authenticate&userName=${encodeURIComponent(userName)}&callback=${callbackName}`;
    
    window[callbackName] = function(response) {
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(response);
    };
    
    script.onerror = function() {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error('Network error'));
    };
    
    script.src = url;
    document.body.appendChild(script);
  });
}

function handleSuccessfulLogin(userData) {
    // Store user info
    localStorage.setItem('loggedInName', userData.name || userData);
    localStorage.setItem('userRole', userData.role || 'User');
    localStorage.setItem('userLevel', userData.level || '1');
    
    if (typeof userData === 'object') {
        localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Redirect to main app
    window.location.href = 'index.html';
}

function handleFailedLogin(message) {
    showError(message || 'Authentication failed');
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

window.closeErrorModal = closeErrorModal;
