// User Management API methods
class UsersAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  async getAllUsers() {
    return this.api.request('getAllUsers');
  }

  async addUser(userData) {
    // Your GAS function expects {name, level, role}
    return this.api.request('addUser', { 
      userData: JSON.stringify({
        name: userData.name,
        level: userData.level,
        role: userData.role
      })
    });
  }

  async deleteUser(userName) {
    return this.api.request('deleteUser', { userName });
  }

  // Mock data for offline/demo
  async getAllUsersMock() {
    return {
      success: true,
      data: [
        { userName: 'admin.user', fullName: 'Admin User', role: 'Admin', level: 10 },
        { userName: 'loan.officer', fullName: 'Loan Officer', role: 'Loan Officer', level: 5 },
        { userName: 'reviewer', fullName: 'Reviewer', role: 'Reviewer', level: 3 }
      ]
    };
  }
}
