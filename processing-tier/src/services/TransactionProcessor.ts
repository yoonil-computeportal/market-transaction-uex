import { logger } from '../utils/logger'
import { DatabaseService } from './DatabaseService'
import { PaymentGateway } from './PaymentGateway'

export class TransactionProcessor {
  private db: DatabaseService
  private paymentGateway: PaymentGateway

  constructor() {
    this.db = new DatabaseService()
    this.paymentGateway = new PaymentGateway()
  }

  async start(): Promise<void> {
    logger.info('Starting Transaction Processor')
    
    // Start processing pending transactions
    this.startTransactionProcessing()
    
    logger.info('Transaction Processor started successfully')
  }

  async stop(): Promise<void> {
    logger.info('Transaction Processor stopped')
  }

  private startTransactionProcessing(): void {
    // Process transactions every 5 seconds
    setInterval(async () => {
      try {
        await this.processPendingTransactions()
      } catch (error) {
        logger.error('Failed to process pending transactions:', error)
      }
    }, 5000)
  }

  private async processPendingTransactions(): Promise<void> {
    const pendingTransactions = await this.getPendingTransactions()
    
    for (const transaction of pendingTransactions) {
      try {
        await this.processTransaction(transaction)
      } catch (error) {
        logger.error(`Failed to process transaction ${transaction.id}:`, error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        await this.markTransactionAsFailed(transaction.id, errorMessage)
      }
    }
  }

  private async processTransaction(transaction: any): Promise<void> {
    // Validate transaction
    await this.validateTransaction(transaction)
    
    // Process payment
    const paymentResult = await this.paymentGateway.processPayment(transaction)
    
    if (paymentResult.success) {
      // Allocate resources
      await this.allocateResources(transaction)
      
      // Mark transaction as completed
      await this.markTransactionAsCompleted(transaction.id)
      
      logger.info(`Transaction ${transaction.id} processed successfully`)
    } else {
      throw new Error(`Payment failed: ${paymentResult.error}`)
    }
  }

  private async validateTransaction(transaction: any): Promise<void> {
    // Check if resources are still available
    for (const resource of transaction.resources) {
      const isAvailable = await this.checkResourceAvailability(resource.resourceId, resource.quantity)
      if (!isAvailable) {
        throw new Error(`Resource ${resource.resourceId} is not available`)
      }
    }
    
    // Validate payment method
    const isValidPayment = await this.paymentGateway.validatePaymentMethod(transaction.paymentMethodId)
    if (!isValidPayment) {
      throw new Error('Invalid payment method')
    }
  }

  private async checkResourceAvailability(resourceId: string, quantity: number): Promise<boolean> {
    const result = await this.db.query(
      'SELECT availability FROM resources WHERE id = $1',
      [resourceId]
    )
    
    if (result.rows.length === 0) {
      return false
    }
    
    return result.rows[0].availability >= quantity
  }

  private async allocateResources(transaction: any): Promise<void> {
    for (const resource of transaction.resources) {
      await this.db.query(`
        UPDATE resources 
        SET availability = availability - $1 
        WHERE id = $2
      `, [resource.quantity, resource.resourceId])
      
      // Create allocation record
      await this.db.query(`
        INSERT INTO resource_allocations (id, resource_id, user_id, quantity, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
      `, [this.generateId(), resource.resourceId, transaction.userId, resource.quantity])
    }
  }

  private async getPendingTransactions(): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM transactions 
      WHERE status = 'pending' 
      ORDER BY created_at ASC
    `)
    return result.rows
  }

  private async markTransactionAsCompleted(transactionId: string): Promise<void> {
    await this.db.query(`
      UPDATE transactions 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [transactionId])
  }

  private async markTransactionAsFailed(transactionId: string, error: string): Promise<void> {
    await this.db.query(`
      UPDATE transactions 
      SET status = 'failed', error_message = $1, updated_at = NOW()
      WHERE id = $1
    `, [transactionId, error])
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 