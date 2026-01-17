// debug.js - Debug script to check what's loaded
console.log('=== DEBUG: Checking loaded functions ===');
console.log('showNewApplicationModal:', typeof window.showNewApplicationModal);
console.log('showSection:', typeof window.showSection);
console.log('logout:', typeof window.logout);

// Check if button exists
const addBtn = document.getElementById('add-new-app-btn');
console.log('Add button exists:', !!addBtn);
if (addBtn) {
    console.log('Button onclick handler:', addBtn.onclick);
    console.log('Button event listeners:', addBtn._eventListeners || 'none');
}

// Add a test button for debugging
const testBtn = document.createElement('button');
testBtn.textContent = 'DEBUG: Test Modal';
testBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:10px;background:red;color:white;border:none;border-radius:4px;cursor:pointer;';
testBtn.onclick = function() {
    console.log('DEBUG: Test button clicked');
    console.log('showNewApplicationModal:', window.showNewApplicationModal);
    if (typeof window.showNewApplicationModal === 'function') {
        window.showNewApplicationModal();
    } else {
        alert('Function not available');
    }
};
document.body.appendChild(testBtn);
