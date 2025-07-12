import axios from 'axios'

const MANAGEMENT_BASE_URL = process.env['MANAGEMENT_URL'] || 'http://localhost:9000/api/management/integration'

export class ManagementIntegrationService {
  // 1. Resource Sync
  static async syncResources(payload: any) {
    return axios.post(`${MANAGEMENT_BASE_URL}/resources/sync`, payload)
  }

  // 2. Order State Update
  static async updateOrder(payload: any) {
    return axios.post(`${MANAGEMENT_BASE_URL}/orders/update`, payload)
  }

  // 3. Transaction State Update
  static async updateTransaction(payload: any) {
    return axios.post(`${MANAGEMENT_BASE_URL}/transactions/update`, payload)
  }

  // 4. Fee Config Fetch
  static async fetchFeeConfig() {
    return axios.get(`${MANAGEMENT_BASE_URL}/fees/config`)
  }

  // 5. Settlement Instruction
  static async executeSettlement(payload: any) {
    return axios.post(`${MANAGEMENT_BASE_URL}/settlement/execute`, payload)
  }

  // 6. Compliance/Audit Event
  static async logAuditEvent(payload: any) {
    return axios.post(`${MANAGEMENT_BASE_URL}/audit/log`, payload)
  }

  // 7. Analytics Ingest
  static async ingestAnalytics(payload: any) {
    return axios.post(`${MANAGEMENT_BASE_URL}/analytics/ingest`, payload)
  }

  // 8. Cluster/State Sync
  static async getClusters() {
    return axios.get(`${MANAGEMENT_BASE_URL}/clusters`)
  }

  static async registerOrUpdateCluster(payload: any) {
    return axios.post(`${MANAGEMENT_BASE_URL}/clusters`, payload)
  }
} 