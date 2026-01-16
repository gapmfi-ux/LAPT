// File Operations API methods
class FilesAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  async copyLendingTemplate(appNumber, appFolderId) {
    return this.api.request('copyLendingTemplate', {
      appNumber: appNumber,
      appFolderId: appFolderId
    });
  }

  async uploadApplicationFile(fileData, appNumber, appFolderId, docType) {
    return this.api.request('uploadApplicationFile', {
      fileData: JSON.stringify(fileData),
      appNumber: appNumber,
      appFolderId: appFolderId,
      docType: docType
    });
  }

  async updateApplicationFile(fileData, appNumber, docType, userName) {
    return this.api.request('updateApplicationFile', {
      fileData: JSON.stringify(fileData),
      appNumber: appNumber,
      docType: docType,
      userName: userName
    });
  }

  async removeApplicationFile(appNumber, fileName, userName) {
    return this.api.request('removeApplicationFile', {
      appNumber: appNumber,
      fileName: fileName,
      userName: userName
    });
  }
}
