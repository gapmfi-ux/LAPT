// Login.js
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    const loginNameInput = document.getElementById('login-name');
    
    if (loginNameInput) {
        loginNameInput.focus();
        
        // Auto-select text on focus
        loginNameInput.addEventListener('focus', function() {
            this.select();
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Add demo users for testing (remove in production)
    addDemoUsers();
}

function handleLoginSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('login-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    // Show loading
    showLoading('Authenticating...');
    
    // Call API
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
            handleApiError(error);
        });
}

function handleSuccessfulLogin(name, user) {
    // Save user information
    localStorage.setItem('loggedInName', name);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userLevel', user.level);
    
    // Get initial application count
    gasAPI.getApplicationsCountForUser(name)
        .then(function(count) {
            localStorage.setItem('lastAppCount', count.toString());
        })
        .catch(console.error);
    
    // Show success message
    showSuccessModal('Login successful!');
    
    // Redirect to dashboard
    setTimeout(function() {
        window.location.href = 'index.html#dashboard';
    }, 1000);
}

function handleFailedLogin(message) {
    alert(message || 'Authentication failed. Please check your name and try again.');
    
    const nameInput = document.getElementById('login-name');
    if (nameInput) {
        nameInput.focus();
        nameInput.select();
    }
}

function handleApiError(error) {
    alert('Connection error: ' + error.message + '\n\nPlease check your internet connection and try again.');
}

// Demo users for testing (remove in production)
function addDemoUsers() {
    const demoUsers = [
        { name: 'Credit Officer', role: 'Credit Sales Officer' },
        { name: 'Credit Analyst', role: 'Credit Analyst' },
        { name: 'AMLRO', role: 'AMLRO' },
        { name: 'Head of Credit', role: 'Head of Credit' },
        { name: 'Branch Manager', role: 'Branch Manager/Approver' },
        { name: 'Approver', role: 'Approver' },
        { name: 'Admin', role: 'Admin' }
    ];
    
    const form = document.getElementById('login-form');
    if (form) {
        const demoSection = document.createElement('div');
        demoSection.className = 'demo-users';
        demoSection.innerHTML = `
            <h3>Demo Users (Click to Login)</h3>
            <div class="demo-user-list">
                ${demoUsers.map(user => `
                    <div class="demo-user" onclick="fillDemoLogin('${user.name}')">
                        ${user.name}
                    </div>
                `).join('')}
            </div>
        `;
        
        form.parentNode.insertBefore(demoSection, form.nextSibling);
    }
}

function fillDemoLogin(userName) {
    const loginInput = document.getElementById('login-name');
    if (loginInput) {
        loginInput.value = userName;
        loginInput.focus();
        loginInput.select();
    }
}

// Make functions available globally
window.fillDemoLogin = fillDemoLogin;
