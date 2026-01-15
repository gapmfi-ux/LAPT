// User Management JS
let currentSection = 'users-list';

function initializeUserManagement(sectionId = 'users-list') {
    currentSection = sectionId;
    
    // Show appropriate section
    showSection(sectionId);
    
    // Load users list if needed
    if (sectionId === 'users-list') {
        loadUsersList();
    }
    
    // Setup form if needed
    if (sectionId === 'add-user') {
        setupAddUserForm();
    }
}

function showSection(sectionId) {
    currentSection = sectionId;
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Load data if needed
    if (sectionId === 'users-list') {
        loadUsersList();
    }
}

function setupAddUserForm() {
    const form = document.getElementById('add-user-form');
    if (!form) return;
    
    form.reset();
    
    // Set up form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('new-user-name')?.value.trim();
        const level = document.getElementById('new-user-level')?.value;
        const role = document.getElementById('new-user-role')?.value;
        
        if (!name || !level || !role) {
            alert('Please fill all required fields!');
            return;
        }
        
        const userData = {
            name: name,
            level: parseInt(level),
            role: role
        };
        
        try {
            const result = await gasAPI.addUser(userData);
            
            if (result.success) {
                showSuccessModal('User added successfully!');
                form.reset();
                showSection('users-list');
            } else {
                alert('Error: ' + (result.message || 'Failed to add user'));
            }
        } catch (error) {
            alert('Error adding user: ' + error.message);
        }
    });
}

async function loadUsersList() {
    const tbody = document.getElementById('users-list-body');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading users...
            </td>
        </tr>
    `;
    
    try {
        const users = await gasAPI.getAllUsers();
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data">
                        <i class="fas fa-user-slash"></i> No users found
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td class="user-name">${escapeHtml(user.name)}</td>
                <td class="user-level">${user.level}</td>
                <td class="user-role">
                    <span class="role-badge ${getRoleClass(user.role)}">
                        ${escapeHtml(user.role)}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn-icon btn-delete" 
                            onclick="deleteUser('${escapeHtml(user.name)}')"
                            title="Delete user">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="error">
                    <i class="fas fa-exclamation-triangle"></i> Error loading users: ${error.message}
                </td>
            </tr>
        `;
    }
}

function getRoleClass(role) {
    const roleMap = {
        'Credit Sales Officer': 'role-credit-sales',
        'Credit Analyst': 'role-credit-analyst',
        'AMLRO': 'role-amlro',
        'Head of Credit': 'role-head-credit',
        'Branch Manager/Approver': 'role-branch-manager',
        'Approver': 'role-approver',
        'Admin': 'role-admin'
    };
    
    return roleMap[role] || '';
}

async function deleteUser(userName) {
    if (!confirm(`Are you sure you want to delete user: ${userName}?`)) {
        return;
    }
    
    try {
        const result = await gasAPI.deleteUser(userName);
        
        if (result.success) {
            showSuccessModal('User deleted successfully!');
            loadUsersList();
        } else {
            alert('Error: ' + (result.message || 'Failed to delete user'));
        }
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}

function refreshUsersList() {
    loadUsersList();
}

// Make functions globally available
window.initializeUserManagement = initializeUserManagement;
window.showSection = showSection;
window.refreshUsersList = refreshUsersList;
window.deleteUser = deleteUser;
