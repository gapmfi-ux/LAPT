// Application API methods
class ApplicationsAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  async getNewApplications() {
    return this.api.request('getNewApplications');
  }

  async getPendingApplications() {
    return this.api.request('getPendingApplications');
  }

  async getPendingApprovalApplications() {
    return this.api.request('getPendingApprovalApplications');
  }

  async getApprovedApplications() {
    return this.api.request('getApprovedApplications');
  }

  async getAllApplicationCounts() {
    return this.api.request('getAllApplicationCounts');
  }

  async getApplicationDetails(appNumber) {
    return this.api.request('getApplicationDetails', { appNumber });
  }

  async getApplicationDocuments(appNumber) {
    return this.api.request('getApplicationDocuments', { appNumber });
  }

  async getNewApplicationContext() {
    return this.api.request('getNewApplicationContext');
  }

  async saveApplicationDraft(applicationData) {
    return this.api.request('saveApplicationDraft', applicationData);
  }

  async submitApplication(applicationData) {
    return this.api.request('submitApplication', applicationData);
  }

  async revertApplicationStage(appNumber, targetStage, userName) {
    return this.api.request('revertApplicationStage', {
      appNumber: appNumber,
      targetStage: targetStage,
      userName: userName
    });
  }
}
