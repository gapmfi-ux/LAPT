// Applications API Functions
const ApplicationsAPI = {
  // Get applications by status
  getNewApplications: function() {
    return ApiCore.makeJsonpRequest('getNewApplications', {}, 
      { useCache: true, cacheKey: 'new_applications' });
  },
  
  getPendingApplications: function() {
    return ApiCore.makeJsonpRequest('getPendingApplications', {}, 
      { useCache: true, cacheKey: 'pending_applications' });
  },
  
  getPendingApprovalApplications: function() {
    return ApiCore.makeJsonpRequest('getPendingApprovalApplications', {}, 
      { useCache: true, cacheKey: 'pending_approval_applications' });
  },
  
  getApprovedApplications: function() {
    return ApiCore.makeJsonpRequest('getApprovedApplications', {}, 
      { useCache: true, cacheKey: 'approved_applications' });
  },
  
  // Get all counts
  getAllApplicationCounts: function() {
    return ApiCore.makeJsonpRequest('getAllApplicationCounts', {}, 
      { useCache: true, cacheKey: 'all_counts', cacheTTL: 30000 });
  },
  
  // Get application details
  getApplicationDetails: function(appNumber) {
    const cacheKey = `app_details_${appNumber}`;
    return ApiCore.makeJsonpRequest('getApplicationDetails', 
      { appNumber: appNumber }, 
      { useCache: true, cacheKey: cacheKey });
  },
  
  // Save application
  saveApplicationDraft: function(applicationData) {
    // Clear relevant caches
    ApiCore.apiCache.clear('new_applications');
    ApiCore.apiCache.clear('all_counts');
    return ApiCore.makeJsonpRequest('saveApplicationDraft', applicationData);
  },
  
  submitApplication: function(applicationData) {
    // Clear relevant caches
    ApiCore.apiCache.clear('new_applications');
    ApiCore.apiCache.clear('pending_applications');
    ApiCore.apiCache.clear('all_counts');
    return ApiCore.makeJsonpRequest('submitApplication', applicationData);
  },
  
  // Revert stage
  revertApplicationStage: function(appNumber, targetStage, userName) {
    // Clear caches
    ApiCore.apiCache.clear();
    return ApiCore.makeJsonpRequest('revertApplicationStage', {
      appNumber: appNumber,
      targetStage: targetStage,
      userName: userName
    });
  },
  
  // Find application
  findApplicationRow: function(appNumber) {
    return ApiCore.makeJsonpRequest('findApplicationRow', { appNumber: appNumber });
  },
  
  // Get unrestricted details (admin only)
  getApplicationDetailsUnrestricted: function(appNumber) {
    return ApiCore.makeJsonpRequest('getApplicationDetailsUnrestricted', { appNumber: appNumber });
  }
};

// Export
window.ApplicationsAPI = ApplicationsAPI;
