// New Application API methods
class NewApplicationAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  // Get context for new application (app number + folder)
  async getNewApplicationContext() {
    return this.api.request('getNewApplicationContext');
  }

  // Save application as draft
  async saveApplicationDraft(applicationData) {
    return this.api.request('saveApplicationDraft', {
      applicationData: JSON.stringify(applicationData)
    });
  }

  // Submit application
  async submitApplication(applicationData) {
    return this.api.request('submitApplication', {
      applicationData: JSON.stringify(applicationData)
    });
  }

  // Copy lending template
  async copyLendingTemplate(appNumber, appFolderId) {
    return this.api.request('copyLendingTemplate', {
      appNumber: appNumber,
      appFolderId: appFolderId
    });
  }

  // Upload file for new application
  async uploadApplicationFile(fileData, appNumber, appFolderId, docType) {
    return this.api.request('uploadApplicationFile', {
      fileData: JSON.stringify(fileData),
      appNumber: appNumber,
      appFolderId: appFolderId,
      docType: docType
    });
  }

  // Save full application form (comprehensive save)
  async saveProcessApplicationForm(appNumber, formData, userName = '', isDraft = false) {
    return this.api.request('saveProcessApplicationForm', {
      appNumber: appNumber,
      formData: JSON.stringify(formData),
      userName: userName,
      isDraft: isDraft
    });
  }

  // Update file for existing application
  async updateApplicationFile(fileData, appNumber, docType, userName) {
    return this.api.request('updateApplicationFile', {
      fileData: JSON.stringify(fileData),
      appNumber: appNumber,
      docType: docType,
      userName: userName
    });
  }

  // Remove file from application
  async removeApplicationFile(appNumber, fileName, userName) {
    return this.api.request('removeApplicationFile', {
      appNumber: appNumber,
      fileName: fileName,
      userName: userName
    });
  }
}
