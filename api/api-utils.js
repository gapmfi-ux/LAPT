// Utility API methods
class UtilsAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  async getApplicationDetailsUnrestricted(appNumber) {
    return this.api.request('getApplicationDetailsUnrestricted', { appNumber });
  }

  async findApplicationRow(appNumber) {
    return this.api.request('findApplicationRow', { appNumber });
  }

  async initializeSpreadsheet() {
    return this.api.request('initializeSpreadsheet');
  }

  async getSpreadsheet() {
    return this.api.request('getSpreadsheet');
  }

  async getUsersSheet() {
    return this.api.request('getUsersSheet');
  }
}
