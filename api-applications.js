// Application Management API Functions
if (typeof window.makeJsonpRequest === 'undefined') {
    console.error('api-core.js must be loaded before api-applications.js');
} else {
    const applicationsAPI = {
        // ===== APPLICATION LIST FUNCTIONS =====
        getNewApplications: function() {
            return makeJsonpRequest('getNewApplications');
        },
        
        getPendingApplications: function() {
            return makeJsonpRequest('getPendingApplications');
        },
        
        getPendingApprovalApplications: function() {
            return makeJsonpRequest('getPendingApprovalApplications');
        },
        
        getApprovedApplications: function() {
            return makeJsonpRequest('getApprovedApplications');
        },
        
        getAllApplicationCounts: function() {
            return makeJsonpRequest('getAllApplicationCounts');
        },
        
        // ===== APPLICATION DETAIL FUNCTIONS =====
        getApplicationDetails: function(appNumber) {
            return makeJsonpRequest('getApplicationDetails', { appNumber: appNumber });
        },
        
        getApplicationDocuments: function(appNumber) {
            return makeJsonpRequest('getApplicationDocuments', { appNumber: appNumber });
        },
        
        // ===== APPLICATION CRUD OPERATIONS =====
        saveApplicationDraft: function(applicationData) {
            return makeJsonpRequest('saveApplicationDraft', applicationData);
        },
        
        submitApplication: function(applicationData) {
            return makeJsonpRequest('submitApplication', applicationData);
        },
        
        revertApplicationStage: function(appNumber, targetStage, userName) {
            return makeJsonpRequest('revertApplicationStage', {
                appNumber: appNumber,
                targetStage: targetStage,
                userName: userName
            });
        },
        
        // ===== UTILITY FUNCTIONS =====
        getApplicationDetailsUnrestricted: function(appNumber) {
            return makeJsonpRequest('getApplicationDetailsUnrestricted', { appNumber: appNumber });
        },
        
        findApplicationRow: function(appNumber) {
            return makeJsonpRequest('findApplicationRow', { appNumber: appNumber });
        },
        
        // Helper method to get applications by status
        getApplicationsByStatus: async function(status) {
            const statusMap = {
                'new': 'getNewApplications',
                'pending': 'getPendingApplications',
                'pending_approval': 'getPendingApprovalApplications',
                'approved': 'getApprovedApplications'
            };
            
            const method = statusMap[status];
            if (!method) {
                throw new Error(`Invalid status: ${status}`);
            }
            
            return await this[method]();
        }
    };
    
    // Make available globally
    window.applicationsAPI = applicationsAPI;
    console.log('Applications API module loaded');
}
