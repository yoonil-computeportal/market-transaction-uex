import { Pool, PoolClient, QueryResult } from 'pg'
import { logger } from '../utils/logger'

export class DatabaseService {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'marketplace_processing',
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err)
    })
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      logger.debug('Executed query', { text, duration, rows: result.rowCount })
      return result
    } catch (error) {
      logger.error('Database query error', { text, params, error })
      throw error
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect()
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
} 