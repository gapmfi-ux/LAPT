// Workflow API Functions
const WorkflowAPI = {
  // Get stage for role
  getStageForRole: function(role) {
    return ApiCore.makeJsonpRequest('getStageForRole', { role: role });
  },
  
  // Get next stage and status
  getNextStageAndStatus: function(currentStage, action) {
    return ApiCore.makeJsonpRequest('getNextStageAndStatus', {
      currentStage: currentStage,
      action: action
    });
  },
  
  // Check if user can act on application
  canUserActOnApplication: function(userName, stage) {
    return ApiCore.makeJsonpRequest('canUserActOnApplication', {
      userName: userName,
      stage: stage
    });
  },
  
  // Update stage tracking
  updateStageTracking: function(appNumber, stage, userName) {
    return ApiCore.makeJsonpRequest('updateStageTracking', {
      appNumber: appNumber,
      stage: stage,
      userName: userName
    });
  },
  
  // Find action by for next stage
  findActionByForNextStage: function(nextStage, currentUser) {
    return ApiCore.makeJsonpRequest('findActionByForNextStage', {
      nextStage: nextStage,
      currentUser: currentUser
    });
  },
  
  // Get workflow matrix
  getWorkflowMatrix: function() {
    // This could be static or fetched from server
    return Promise.resolve({
      "New": {
        SUBMIT: { stage: "Assessment", status: "PENDING" },
        DRAFT: { stage: "New", status: "NEW" }
      },
      "Assessment": {
        SUBMIT: { stage: "Compliance", status: "PENDING" },
        DRAFT: { stage: "Assessment", status: "PENDING" }
      },
      // ... rest of workflow matrix
    });
  },
  
  // Get role stage map
  getRoleStageMap: function() {
    // This could be static or fetched from server
    return Promise.resolve({
      "Credit Officer": ["New", "Assessment"],
      "AMLRO": ["Compliance"],
      "Head of Credit": ["Ist Review"],
      "Branch Manager/Approver": ["2nd Review"],
      "Approver": ["Approval"],
      "Admin": ["ALL"]
    });
  }
};

// Export
window.WorkflowAPI = WorkflowAPI;
