// File Operations API Functions
if (typeof window.makeJsonpRequest === 'undefined') {
    console.error('api-core.js must be loaded before api-files.js');
} else {
    const filesAPI = {
        getNewApplicationContext: function() {
            return makeJsonpRequest('getNewApplicationContext');
        },
        
        copyLendingTemplate: function(appNumber, appFolderId) {
            return makeJsonpRequest('copyLendingTemplate', {
                appNumber: appNumber,
                appFolderId: appFolderId
            });
        },
        
        uploadApplicationFile: function(fileData, appNumber, appFolderId, docType) {
            return makeJsonpRequest('uploadApplicationFile', {
                fileData: fileData,
                appNumber: appNumber,
                appFolderId: appFolderId,
                docType: docType
            });
        },
        
        updateApplicationFile: function(fileData, appNumber, docType, userName) {
            return makeJsonpRequest('updateApplicationFile', {
                fileData: fileData,
                appNumber: appNumber,
                docType: docType,
                userName: userName
            });
        },
        
        removeApplicationFile: function(appNumber, fileName, userName) {
            return makeJsonpRequest('removeApplicationFile', {
                appNumber: appNumber,
                fileName: fileName,
                userName: userName
            });
        },
        
        // Helper method to prepare file for upload
        prepareFileForUpload: function(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Data = e.target.result.split(',')[1];
                    resolve({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        base64Data: base64Data
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        
        // Helper method to validate file type
        isValidFileType: function(fileName, allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']) {
            const extension = fileName.split('.').pop().toLowerCase();
            return allowedTypes.includes(extension);
        }
    };
    
    // Make available globally
    window.filesAPI = filesAPI;
    console.log('Files API module loaded');
}
