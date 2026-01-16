// View Application API methods
class ViewApplicationAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  // Get application details with all related data
  async getApplicationDetails(appNumber, userName = '') {
    return this.api.request('getApplicationDetails', {
      appNumber: appNumber,
      userName: userName
    });
  }

  // Get application documents
  async getApplicationDocuments(appNumber) {
    return this.api.request('getApplicationDocuments', { appNumber });
  }

  // Get application details without restrictions (admin/backoffice)
  async getApplicationDetailsUnrestricted(appNumber) {
    return this.api.request('getApplicationDetailsUnrestricted', { appNumber });
  }

  // Submit application comments/approval
  async submitApplicationComment(requestData, userName) {
    return this.api.request('submitApplicationComment', {
      requestData: JSON.stringify(requestData),
      userName: userName
    });
  }

  // Update stage tracking
  async updateStageTracking(appNumber, stage, userName) {
    return this.api.request('updateStageTracking', {
      appNumber: appNumber,
      stage: stage,
      userName: userName
    });
  }

  // Get workflow next stage
  async getNextStageAndStatus(currentStage, action) {
    return this.api.request('getNextStageAndStatus', {
      currentStage: currentStage,
      action: action
    });
  }

  // Check if user can act on application
  async canUserActOnApplication(userName, stage) {
    return this.api.request('canUserActOnApplication', {
      userName: userName,
      stage: stage
    });
  }

  // Revert application stage
  async revertApplicationStage(appNumber, targetStage, userName) {
    return this.api.request('revertApplicationStage', {
      appNumber: appNumber,
      targetStage: targetStage,
      userName: userName
    });
  }

  // Find action by for next stage
  async findActionByForNextStage(nextStage, currentUser) {
    return this.api.request('findActionByForNextStage', {
      nextStage: nextStage,
      currentUser: currentUser
    });
  }
}
