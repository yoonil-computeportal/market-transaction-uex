import { v4 as uuidv4 } from 'uuid';
import { db, TABLES } from '../models/Database';
import { 
  PaymentTransaction, 
  SellerPayoutAccount, 
  CurrencyConversion, 
  ManagementTierFee,
  ExchangeRate,
  WorkflowStep 
} from '../types';

export class DatabaseService {
  // Payment Transactions
  async createPaymentTransaction(transaction: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentTransaction> {
    const transactionWithId = { ...transaction, id: uuidv4() };
    const [result] = await db(TABLES.PAYMENT_TRANSACTIONS)
      .insert(transactionWithId)
      .returning('*');
    return result;
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | null> {
    const result = await db(TABLES.PAYMENT_TRANSACTIONS)
      .where({ id })
      .first();
    return result || null;
  }

  async updatePaymentTransaction(id: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction | null> {
    const [result] = await db(TABLES.PAYMENT_TRANSACTIONS)
      .where({ id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return result || null;
  }

  async getPaymentTransactionsByStatus(status: PaymentTransaction['status']): Promise<PaymentTransaction[]> {
    return await db(TABLES.PAYMENT_TRANSACTIONS)
      .where({ status })
      .orderBy('created_at', 'desc');
  }

  // Seller Payout Accounts
  async createSellerPayoutAccount(account: Omit<SellerPayoutAccount, 'id' | 'created_at' | 'updated_at'>): Promise<SellerPayoutAccount> {
    const accountWithId = { ...account, id: uuidv4() };
    const [result] = await db(TABLES.SELLER_PAYOUT_ACCOUNTS)
      .insert(accountWithId)
      .returning('*');
    return result;
  }

  async getSellerPayoutAccounts(sellerId: string): Promise<SellerPayoutAccount[]> {
    return await db(TABLES.SELLER_PAYOUT_ACCOUNTS)
      .where({ seller_id: sellerId, is_active: true })
      .orderBy('created_at', 'desc');
  }

  // Currency Conversions
  async createCurrencyConversion(conversion: Omit<CurrencyConversion, 'id' | 'created_at'>): Promise<CurrencyConversion> {
    const conversionWithId = { ...conversion, id: uuidv4() };
    const [result] = await db(TABLES.CURRENCY_CONVERSIONS)
      .insert(conversionWithId)
      .returning('*');
    return result;
  }

  async getCurrencyConversionsByTransaction(transactionId: string): Promise<CurrencyConversion[]> {
    return await db(TABLES.CURRENCY_CONVERSIONS)
      .where({ transaction_id: transactionId })
      .orderBy('created_at', 'desc');
  }

  // Management Tier Fees
  async createManagementTierFee(fee: Omit<ManagementTierFee, 'id' | 'created_at'>): Promise<ManagementTierFee> {
    const feeWithId = { ...fee, id: uuidv4() };
    const [result] = await db(TABLES.MANAGEMENT_TIER_FEES)
      .insert(feeWithId)
      .returning('*');
    return result;
  }

  async getManagementTierFeesByTransaction(transactionId: string): Promise<ManagementTierFee[]> {
    return await db(TABLES.MANAGEMENT_TIER_FEES)
      .where({ transaction_id: transactionId })
      .orderBy('created_at', 'desc');
  }

  // Exchange Rates
  async createExchangeRate(rate: Omit<ExchangeRate, 'id' | 'created_at'>): Promise<ExchangeRate> {
    const rateWithId = { ...rate, id: uuidv4() };
    const [result] = await db(TABLES.EXCHANGE_RATES)
      .insert(rateWithId)
      .returning('*');
    return result;
  }

  async getLatestExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> {
    const result = await db(TABLES.EXCHANGE_RATES)
      .where({ from_currency: fromCurrency, to_currency: toCurrency })
      .where('valid_until', '>', new Date())
      .orderBy('created_at', 'desc')
      .first();
    return result || null;
  }

  // Workflow Steps
  async createWorkflowStep(step: Omit<WorkflowStep, 'id' | 'created_at'>): Promise<WorkflowStep> {
    const stepWithId = { ...step, id: uuidv4() };
    const [result] = await db(TABLES.WORKFLOW_STEPS)
      .insert(stepWithId)
      .returning('*');
    return result;
  }

  async updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep | null> {
    const [result] = await db(TABLES.WORKFLOW_STEPS)
      .where({ id })
      .update(updates)
      .returning('*');
    return result || null;
  }

  async getWorkflowStepsByTransaction(transactionId: string): Promise<WorkflowStep[]> {
    return await db(TABLES.WORKFLOW_STEPS)
      .where({ transaction_id: transactionId })
      .orderBy('created_at', 'asc');
  }

  // Analytics and Reporting
  async getTransactionStats(startDate: Date, endDate: Date): Promise<any> {
    const stats = await db(TABLES.PAYMENT_TRANSACTIONS)
      .select(
        db.raw('COUNT(*) as total_transactions'),
        db.raw('SUM(total_amount) as total_volume'),
        db.raw('AVG(total_amount) as average_amount'),
        db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_transactions'),
        db.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed_transactions')
      )
      .whereBetween('created_at', [startDate, endDate]);

    return stats[0];
  }

  async getCurrencyConversionStats(startDate: Date, endDate: Date): Promise<any[]> {
    return await db(TABLES.CURRENCY_CONVERSIONS)
      .select(
        'from_currency',
        'to_currency',
        db.raw('COUNT(*) as conversion_count'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('SUM(conversion_fee) as total_fees'),
        db.raw('AVG(exchange_rate) as average_rate')
      )
      .whereBetween('created_at', [startDate, endDate])
      .groupBy('from_currency', 'to_currency')
      .orderBy('conversion_count', 'desc');
  }
} 