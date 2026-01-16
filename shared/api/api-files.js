// File Operations API Functions
const FilesAPI = {
  // Get application context for new app
  getNewApplicationContext: function() {
    return ApiCore.makeJsonpRequest('getNewApplicationContext');
  },
  
  // Copy lending template
  copyLendingTemplate: function(appNumber, appFolderId) {
    return ApiCore.makeJsonpRequest('copyLendingTemplate', {
      appNumber: appNumber,
      appFolderId: appFolderId
    });
  },
  
  // Upload file
  uploadApplicationFile: function(fileData, appNumber, appFolderId, docType) {
    return ApiCore.makeJsonpRequest('uploadApplicationFile', {
      fileData: fileData,
      appNumber: appNumber,
      appFolderId: appFolderId,
      docType: docType
    });
  },
  
  // Update file
  updateApplicationFile: function(fileData, appNumber, docType, userName) {
    return ApiCore.makeJsonpRequest('updateApplicationFile', {
      fileData: fileData,
      appNumber: appNumber,
      docType: docType,
      userName: userName
    });
  },
  
  // Remove file
  removeApplicationFile: function(appNumber, fileName, userName) {
    return ApiCore.makeJsonpRequest('removeApplicationFile', {
      appNumber: appNumber,
      fileName: fileName,
      userName: userName
    });
  },
  
  // Get application documents
  getApplicationDocuments: function(appNumber) {
    const cacheKey = `app_docs_${appNumber}`;
    return ApiCore.makeJsonpRequest('getApplicationDocuments', 
      { appNumber: appNumber }, 
      { useCache: true, cacheKey: cacheKey });
  },
  
  // Get document type from filename
  getDocumentType: function(filename) {
    if (filename.includes('BS')) return 'bankStatement';
    if (filename.includes('PS')) return 'paySlip';
    if (filename.includes('LU')) return 'undertaking';
    if (filename.includes('LS')) return 'loanStatement';
    if (filename.includes('LT')) return 'template';
    return 'other';
  }
};

// Export
window.FilesAPI = FilesAPI;
