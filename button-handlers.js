// button-handlers.js - Handle all button events

console.log('button-handlers.js loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up button handlers...');
    
    // Set up button click handlers after a delay to ensure all scripts are loaded
    setTimeout(setupButtonHandlers, 1000);
});

function setupButtonHandlers() {
    console.log('Setting up button handlers...');
    
    // 1. Add New Application button
    const addNewAppBtn = document.getElementById('add-new-app-btn');
    if (addNewAppBtn) {
        console.log('Found Add New Application button');
        addNewAppBtn.addEventListener('click', handleAddNewApplication);
    } else {
        console.error('Add New Application button not found!');
    }
    
    // 2. Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (typeof window.logout === 'function') {
                window.logout();
            } else {
                console.error('logout function not found');
            }
        });
    }
    
    // 3. Side menu buttons
    document.querySelectorAll('.menu-btn').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section && typeof window.showSection === 'function') {
                window.showSection(section);
            }
        });
    });
    
    // 4. Modal close buttons
    const closeButtons = document.querySelectorAll('[onclick*="close"]');
    closeButtons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        if (onclick.includes('closeSuccessModal')) {
            button.addEventListener('click', function() {
                if (typeof window.closeSuccessModal === 'function') {
                    window.closeSuccessModal();
                }
            });
        } else if (onclick.includes('closeErrorModal')) {
            button.addEventListener('click', function() {
                if (typeof window.closeErrorModal === 'function') {
                    window.closeErrorModal();
                }
            });
        } else if (onclick.includes('closeConfirmationModal')) {
            const isConfirm = onclick.includes('true');
            button.addEventListener('click', function() {
                if (typeof window.closeConfirmationModal === 'function') {
                    window.closeConfirmationModal(isConfirm);
                }
            });
        }
    });
    
    console.log('Button handlers setup complete');
}

function handleAddNewApplication() {
    console.log('Add New Application button clicked');
    console.log('showNewApplicationModal type:', typeof window.showNewApplicationModal);
    
    if (typeof window.showNewApplicationModal === 'function') {
        console.log('Calling showNewApplicationModal...');
        window.showNewApplicationModal();
    } else {
        console.error('showNewApplicationModal is not a function!');
        console.log('Checking window properties...');
        
        // Debug: List all window properties containing "show" or "new"
        const relevantProps = Object.keys(window).filter(key => 
            key.toLowerCase().includes('show') || 
            key.toLowerCase().includes('new') ||
            key.toLowerCase().includes('modal')
        );
        console.log('Relevant window properties:', relevantProps);
        
        // Try to load newApps.js dynamically if it failed
        console.log('Attempting to load newApps.js dynamically...');
        const script = document.createElement('script');
        script.src = 'new-application/newApps.js';
        script.onload = function() {
            console.log('newApps.js loaded dynamically');
            if (typeof window.showNewApplicationModal === 'function') {
                window.showNewApplicationModal();
            } else {
                alert('Failed to load application form. Please refresh the page.');
            }
        };
        script.onerror = function() {
            console.error('Failed to load newApps.js dynamically');
            alert('Cannot load application form. Please check your connection.');
        };
        document.body.appendChild(script);
    }
}

// Make function available globally for debugging
window.handleAddNewApplication = handleAddNewApplication;
window.setupButtonHandlers = setupButtonHandlers;

console.log('button-handlers.js initialization complete');
