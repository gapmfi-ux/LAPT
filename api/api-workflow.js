// Workflow API methods
class WorkflowAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  async getStageForRole(role) {
    return this.api.request('getStageForRole', { role });
  }

  async getNextStageAndStatus(currentStage, action) {
    return this.api.request('getNextStageAndStatus', {
      currentStage: currentStage,
      action: action
    });
  }

  async canUserActOnApplication(userName, stage) {
    return this.api.request('canUserActOnApplication', {
      userName: userName,
      stage: stage
    });
  }

  async updateStageTracking(appNumber, stage, userName) {
    return this.api.request('updateStageTracking', {
      appNumber: appNumber,
      stage: stage,
      userName: userName
    });
  }

  async findActionByForNextStage(nextStage, currentUser) {
    return this.api.request('findActionByForNextStage', {
      nextStage: nextStage,
      currentUser: currentUser
    });
  }
}
