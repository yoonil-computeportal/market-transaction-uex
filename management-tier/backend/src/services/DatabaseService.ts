import knex, { Knex } from 'knex'
import { logger } from '../utils/logger'

export class DatabaseService {
  private db: Knex

  constructor() {
    this.db = knex({
      client: 'sqlite3',
      connection: {
        filename: process.env['DATABASE_URL'] || './management_tier.sqlite3'
      },
      useNullAsDefault: true,
      migrations: {
        directory: './src/database/migrations'
      },
      seeds: {
        directory: './src/database/seeds'
      }
    })

    // Test the connection
    this.db.raw('SELECT 1')
      .then(() => {
        logger.info('Database connection established')
      })
      .catch((err) => {
        logger.error('Database connection error', err)
      })
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now()
    try {
      const result = await this.db.raw(text, params || [])
      const duration = Date.now() - start
      logger.debug('Executed query', { text, duration, rows: result.length })
      return result
    } catch (error) {
      logger.error('Database query error', { text, params, error })
      throw error
    }
  }

  async getClient(): Promise<Knex> {
    return this.db
  }

  async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(callback)
  }

  async close(): Promise<void> {
    await this.db.destroy()
  }

  // Helper method to get the knex instance
  getKnex(): Knex {
    return this.db
  }
} 