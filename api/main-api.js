// Main API Loader - Combines all API modules
class APILoader {
  constructor() {
    this.apiService = new ApiService();
    this.auth = new AuthAPI(this.apiService);
    this.applications = new ApplicationsAPI(this.apiService);
    this.newApplication = new NewApplicationAPI(this.apiService);    // ADDED
    this.viewApplication = new ViewApplicationAPI(this.apiService);  // ADDED
    this.users = new UsersAPI(this.apiService);
    this.files = new FilesAPI(this.apiService);
    this.workflow = new WorkflowAPI(this.apiService);
    this.utils = new UtilsAPI(this.apiService);
  }

  // Initialize all APIs
  async initialize() {
    console.log('Initializing API modules...');
    
    // Test connection
    const connectionTest = await this.apiService.testConnection();
    console.log('API Connection:', connectionTest);
    
    return connectionTest.connected;
  }

  // Get all APIs in one object
  getAllAPIs() {
    return {
      core: this.apiService,
      auth: this.auth,
      applications: this.applications,
      newApplication: this.newApplication,    // ADDED
      viewApplication: this.viewApplication,  // ADDED
      users: this.users,
      files: this.files,
      workflow: this.workflow,
      utils: this.utils,
      
      // Backward compatibility methods
      authenticateUser: this.auth.authenticateUser.bind(this.auth),
      getAllApplicationCounts: this.applications.getAllApplicationCounts.bind(this.applications),
      getNewApplications: this.applications.getNewApplications.bind(this.applications),
      getPendingApplications: this.applications.getPendingApplications.bind(this.applications),
      getPendingApprovalApplications: this.applications.getPendingApprovalApplications.bind(this.applications),
      getApprovedApplications: this.applications.getApprovedApplications.bind(this.applications),
      getApplicationDetails: this.viewApplication.getApplicationDetails.bind(this.viewApplication),
      getNewApplicationContext: this.newApplication.getNewApplicationContext.bind(this.newApplication),
      copyLendingTemplate: this.newApplication.copyLendingTemplate.bind(this.newApplication),
      addUser: this.users.addUser.bind(this.users),
      deleteUser: this.users.deleteUser.bind(this.users),
      getAllUsers: this.users.getAllUsers.bind(this.users),
      testConnection: this.apiService.testConnection.bind(this.apiService),
      saveProcessApplicationForm: this.newApplication.saveProcessApplicationForm.bind(this.newApplication)
    };
  }
}

// Create global API instance when all modules are loaded
document.addEventListener('DOMContentLoaded', function() {
  if (!window.apiLoader) {
    window.apiLoader = new APILoader();

    // IMPORTANT: publish a global promise so other scripts can await API readiness
    window.apiReadyPromise = window.apiLoader.initialize().then(success => {
      if (success) {
        console.log('All API modules initialized successfully');
      } else {
        console.warn('API initialization had issues, but APIs are available in offline mode');
      }
      
      // Create global API instances
      const apis = window.apiLoader.getAllAPIs();
      window.apiService = apis.core;
      window.gasAPI = apis; // For backward compatibility
      window.authAPI = apis.auth;
      window.appsAPI = apis.applications;
      window.newAppAPI = apis.newApplication;      // ADDED
      window.viewAppAPI = apis.viewApplication;    // ADDED
      window.usersAPI = apis.users;
      window.filesAPI = apis.files;
      window.workflowAPI = apis.workflow;
      window.utilsAPI = apis.utils;
      
      console.log('Loan Application Tracker APIs loaded successfully');

      return true;
    }).catch(error => {
      console.error('Failed to initialize APIs:', error);
      
      // Still create APIs in offline mode
      window.apiService = new ApiService();
      window.gasAPI = window.apiService;

      // resolve anyway so waiting code doesn't hang forever
      return false;
    });
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APILoader;
}
