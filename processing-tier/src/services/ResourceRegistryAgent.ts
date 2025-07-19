import { logger } from '../utils/logger'
import { Resource } from '../types/Resource'
import { DatabaseService } from './DatabaseService'

export class ResourceRegistryAgent {
  private db: DatabaseService
  private syncInterval: NodeJS.Timeout | null = null
  private readonly SYNC_INTERVAL_MS = 30000 // 30 seconds

  constructor() {
    this.db = new DatabaseService()
  }

  async start(): Promise<void> {
    logger.info('Starting Resource Registry Agent')
    
    // Start local resource monitoring
    await this.startLocalResourceMonitoring()
    
    // Start synchronization with central registry
    this.startSynchronization()
    
    logger.info('Resource Registry Agent started successfully')
  }

  async stop(): Promise<void> {
    logger.info('Stopping Resource Registry Agent')
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    logger.info('Resource Registry Agent stopped')
  }

  private async startLocalResourceMonitoring(): Promise<void> {
    try {
      // Monitor local resource availability
      await this.updateLocalResourceInventory()
      
      // Set up continuous monitoring
      setInterval(async () => {
        await this.updateLocalResourceInventory()
      }, 10000) // Update every 10 seconds
      
      logger.info('Local resource monitoring started')
    } catch (error) {
      logger.error('Failed to start local resource monitoring:', error)
      throw error
    }
  }

  private async updateLocalResourceInventory(): Promise<void> {
    try {
      // Get current local resource state
      const localResources = await this.getLocalResources()
      
      // Update resource utilization
      for (const resource of localResources) {
        const utilization = await this.getResourceUtilization(resource.id)
        await this.updateResourceUtilization(resource.id, utilization)
      }
      
      // Update availability based on current allocations
      await this.updateResourceAvailability()
      
      logger.debug('Local resource inventory updated')
    } catch (error) {
      logger.error('Failed to update local resource inventory:', error)
    }
  }

  private startSynchronization(): void {
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncWithCentralRegistry()
      } catch (error) {
        logger.error('Failed to sync with central registry:', error)
      }
    }, this.SYNC_INTERVAL_MS)
    
    logger.info(`Synchronization started with ${this.SYNC_INTERVAL_MS}ms interval`)
  }

  private async syncWithCentralRegistry(): Promise<void> {
    try {
      // Get local changes since last sync
      const localChanges = await this.getLocalChanges()
      
      if (localChanges.length > 0) {
        // Send changes to central registry
        await this.sendChangesToCentralRegistry(localChanges)
        
        // Mark changes as synced
        await this.markChangesAsSynced(localChanges)
        
        logger.info(`Synced ${localChanges.length} changes with central registry`)
      }
      
      // Get updates from central registry
      const centralUpdates = await this.getCentralRegistryUpdates()
      
      if (centralUpdates.length > 0) {
        // Apply central updates to local registry
        await this.applyCentralUpdates(centralUpdates)
        
        logger.info(`Applied ${centralUpdates.length} updates from central registry`)
      }
    } catch (error) {
      logger.error('Synchronization failed:', error)
      // Implement retry logic with exponential backoff
      await this.handleSyncFailure(error)
    }
  }

  private async getLocalResources(): Promise<Resource[]> {
    // Implementation would query local Kubernetes cluster or resource manager
    // For now, return mock data
    return [
      {
        id: 'local-cpu-1',
        name: 'High-Performance CPU Cluster',
        type: 'CPU',
        specifications: { cpu: 32, memory: 128 },
        price: 2.50,
        currency: 'USD',
        availability: 10,
        location: 'US East',
        provider: 'Local Provider',
        sla: 'Gold',
        rating: 4.8,
        reviews: 150,
        estimatedProvisioningTime: 5,
        utilization: 75
      }
    ]
  }

  private async getResourceUtilization(_resourceId: string): Promise<number> {
    // Implementation would query actual resource utilization
    // For now, return mock data
    return Math.floor(Math.random() * 100)
  }

  private async updateResourceUtilization(resourceId: string, utilization: number): Promise<void> {
    // Update resource utilization in local database
    await this.db.query(
      'UPDATE resources SET utilization = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [utilization, resourceId]
    )
  }

  private async updateResourceAvailability(): Promise<void> {
    // Calculate and update resource availability based on current allocations
    await this.db.query(`
      UPDATE resources 
      SET availability = total_capacity - allocated_capacity 
      WHERE id IN (SELECT resource_id FROM resource_allocations WHERE status = 'active')
    `)
  }

  private async getLocalChanges(): Promise<any[]> {
    // Get changes that haven't been synced yet
    const result = await this.db.query(`
      SELECT * FROM resource_changes 
      WHERE synced = false 
      ORDER BY created_at ASC
    `)
    return result[0] || []
  }

  private async sendChangesToCentralRegistry(changes: any[]): Promise<void> {
    // Implementation would send changes to management tier
    // For now, just log the changes
    logger.info('Sending changes to central registry:', changes)
  }

  private async markChangesAsSynced(changes: any[]): Promise<void> {
    const changeIds = changes.map(change => change.id)
    for (const changeId of changeIds) {
      await this.db.query(
        'UPDATE resource_changes SET synced = true WHERE id = ?',
        [changeId]
      )
    }
  }

  private async getCentralRegistryUpdates(): Promise<any[]> {
    // Implementation would fetch updates from management tier
    // For now, return empty array
    return []
  }

  private async applyCentralUpdates(updates: any[]): Promise<void> {
    // Apply updates from central registry to local database
    for (const update of updates) {
      await this.db.query(
        'UPDATE resources SET data = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [JSON.stringify(update), update.id]
      )
    }
  }

  private async handleSyncFailure(error: any): Promise<void> {
    // Implement retry logic with exponential backoff
    logger.error('Sync failure handled:', error)
  }

  // Public methods for external use
  async advertiseResource(resource: Resource): Promise<void> {
    try {
      // Add resource to local registry
      await this.addResourceToRegistry(resource)
      
      // Mark for synchronization
      await this.markResourceForSync(resource.id)
      
      logger.info(`Resource ${resource.id} advertised successfully`)
    } catch (error) {
      logger.error(`Failed to advertise resource ${resource.id}:`, error)
      throw error
    }
  }

  async handleReservationRequest(resourceId: string, quantity: number): Promise<boolean> {
    try {
      // Check if resource is available
      const resource = await this.getResourceById(resourceId)
      
      if (!resource || resource.availability < quantity) {
        return false
      }
      
      // Reserve the resource
      await this.reserveResource(resourceId, quantity)
      
      logger.info(`Resource ${resourceId} reserved: ${quantity} units`)
      return true
    } catch (error) {
      logger.error(`Failed to handle reservation request for ${resourceId}:`, error)
      return false
    }
  }

  private async addResourceToRegistry(resource: Resource): Promise<void> {
    await this.db.query(`
      INSERT OR REPLACE INTO resources (id, data, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `, [resource.id, JSON.stringify(resource)])
  }

  private async markResourceForSync(resourceId: string): Promise<void> {
    await this.db.query(`
      INSERT INTO resource_changes (resource_id, change_type, synced, created_at)
      VALUES (?, 'advertise', false, datetime('now'))
    `, [resourceId])
  }

  private async getResourceById(resourceId: string): Promise<Resource | null> {
    const result = await this.db.query(
      'SELECT data FROM resources WHERE id = ?',
      [resourceId]
    )
    
    if (result[0].length === 0) {
      return null
    }
    
    return result[0][0].data as Resource
  }

  private async reserveResource(resourceId: string, quantity: number): Promise<void> {
    await this.db.query(`
      UPDATE resources 
      SET availability = availability - ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [quantity, resourceId])
  }
} 