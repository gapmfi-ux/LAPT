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

  async getApplicationDetails(appNumber, userName = '') {
    return this.api.request('getApplicationDetails', { 
      appNumber: appNumber,
      userName: userName 
    });
  }

  async getApplicationDocuments(appNumber) {
    return this.api.request('getApplicationDocuments', { appNumber });
  }

  async getNewApplicationContext() {
    return this.api.request('getNewApplicationContext');
  }

  async saveApplicationDraft(applicationData) {
    // Sending appNumber directly (not as JSON string)
    return this.api.request('saveApplicationDraft', { 
      applicationData: JSON.stringify({ 
        appNumber: applicationData.appNumber,
        isDraft: true 
      }) 
    });
  }

  async submitApplication(applicationData) {
    // Sending appNumber directly (not as JSON string)
    return this.api.request('submitApplication', { 
      applicationData: JSON.stringify({ 
        appNumber: applicationData.appNumber 
      }) 
    });
  }

  async revertApplicationStage(appNumber, targetStage, userName) {
    return this.api.request('revertApplicationStage', {
      appNumber: appNumber,
      targetStage: targetStage,
      userName: userName
    });
  }

  async saveProcessApplicationForm(appNumber, formData) {
    return this.api.request('saveProcessApplicationForm', {
      appNumber: appNumber,
      formData: JSON.stringify(formData)
    });
  }
}
