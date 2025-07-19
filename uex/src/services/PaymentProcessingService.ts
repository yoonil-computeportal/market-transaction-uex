import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { DatabaseService } from './DatabaseService';
import { ExchangeRateService } from './ExchangeRateService';
import { 
  PaymentRequest, 
  PaymentResponse, 
  PaymentTransaction,
  CurrencyConversion,
  ManagementTierFee,
  FeeStructure 
} from '../types';

export class PaymentProcessingService {
  private dbService: DatabaseService;
  private exchangeRateService: ExchangeRateService;

  // Fee structure configuration for CASE IV: Crypto-to-fiat conversion
  private feeStructure: FeeStructure = {
    uex_buyer_fee_percentage: 0.001, // 0.1% from buyer
    uex_seller_fee_percentage: 0.001, // 0.1% from seller
    conversion_fee_percentage: 0.002, // 0.2% conversion fee when currencies differ
    management_fee_percentage: 0.01, // 1.0% management fee (0.5% buyer + 0.5% seller)
    minimum_fee: 0.001, // Reduced minimum fee for better accuracy
    maximum_fee: 100.0,
    currency: 'USD'
  };

  constructor(dbService: DatabaseService, exchangeRateService: ExchangeRateService) {
    this.dbService = dbService;
    this.exchangeRateService = exchangeRateService;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const transactionId = uuidv4();
    
    try {
      // Step 1: Validate the payment request
      await this.validatePaymentRequest(request);

      // Step 2: Calculate exchange rate and fees for CASE IV: Crypto-to-fiat
      const exchangeRate = await this.exchangeRateService.getExchangeRate(
        request.currency, 
        request.target_currency
      );

      // Calculate UEX fees (0.1% from buyer, 0.1% from seller)
      const uexBuyerFee = this.calculateUEXBuyerFee(request.amount);
      const uexSellerFee = this.calculateUEXSellerFee(request.amount);
      const conversionFee = this.calculateConversionFee(request.amount, exchangeRate, request.currency, request.target_currency);
      
      // Calculate management fee (1.0% total: 0.5% from buyer, 0.5% from seller)
      const totalManagementFee = this.calculateManagementFee(request.amount);
      const managementBuyerFee = totalManagementFee * 0.5; // 0.5% from buyer
      const managementSellerFee = totalManagementFee * 0.5; // 0.5% from seller
      
      // Total fees: UEX fees + management fees (split between buyer and seller)
      const totalBuyerFees = uexBuyerFee + managementBuyerFee + conversionFee;
      const totalSellerFees = uexSellerFee + managementSellerFee;
      const totalFee = totalBuyerFees + totalSellerFees;
      const totalAmount = request.amount + totalBuyerFees; // Total amount includes ONLY buyer fees

      // Step 3: Create the payment transaction
      const transaction: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'> = {
        client_id: request.client_id,
        seller_id: request.seller_id,
        amount: request.amount,
        currency: request.currency,
        target_currency: request.target_currency,
        conversion_rate: exchangeRate,
        uex_buyer_fee: uexBuyerFee,
        uex_seller_fee: uexSellerFee,
        conversion_fee: conversionFee,
        management_fee: totalManagementFee, // Total management fee for record keeping
        total_amount: totalAmount,
        status: 'pending',
        payment_method: request.payment_method,
        settlement_method: request.settlement_method
      };

      await this.dbService.createPaymentTransactionWithId(transaction, transactionId);

      // Step 4: Create currency conversion record if needed (no fees)
      if (request.currency !== request.target_currency) {
        const conversion: Omit<CurrencyConversion, 'id' | 'created_at'> = {
          transaction_id: transactionId,
          from_currency: request.currency,
          to_currency: request.target_currency,
          exchange_rate: exchangeRate,
          amount: request.amount,
          converted_amount: request.amount * exchangeRate,
          conversion_fee: 0 // No conversion fee
        };
        await this.dbService.createCurrencyConversion(conversion);
      }

      // Step 5: No fee records created (fees removed)

      // Step 6: Determine settlement time based on payment method
      const estimatedSettlementTime = this.calculateSettlementTime(
        request.payment_method,
        request.settlement_method
      );

      // Step 7: Return payment response
      const response: PaymentResponse = {
        transaction_id: transactionId,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        target_currency: request.target_currency,
        conversion_rate: exchangeRate,
        fees: {
          uex_buyer_fee: uexBuyerFee,
          uex_seller_fee: uexSellerFee,
          conversion_fee: conversionFee,
          management_fee: totalManagementFee,
          total_fee: totalBuyerFees // Only buyer fees for total_fee
        },
        total_amount: totalAmount, // Total amount includes fees
        estimated_settlement_time: estimatedSettlementTime,
        created_at: new Date()
      };

      return response;

    } catch (error) {
      // Update transaction status to failed if it was created
      try {
        await this.dbService.updatePaymentTransaction(transactionId, {
          status: 'failed',
          failure_reason: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }

      throw error;
    }
  }

  private async validatePaymentRequest(request: PaymentRequest): Promise<void> {
    // Validate required fields
    if (!request.client_id || !request.seller_id || !request.amount || !request.currency || !request.target_currency) {
      throw new Error('Missing required fields in payment request');
    }

    // Validate amount
    if (request.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate currencies
    const supportedCurrencies = await this.exchangeRateService.getSupportedCurrencies();
    if (!supportedCurrencies.includes(request.currency)) {
      throw new Error(`Unsupported source currency: ${request.currency}`);
    }
    if (!supportedCurrencies.includes(request.target_currency)) {
      throw new Error(`Unsupported target currency: ${request.target_currency}`);
    }

    // Validate currency pair if conversion is needed
    if (request.currency !== request.target_currency) {
      const isValidPair = await this.exchangeRateService.validateCurrencyPair(
        request.currency, 
        request.target_currency
      );
      if (!isValidPair) {
        throw new Error(`Currency conversion not supported: ${request.currency} to ${request.target_currency}`);
      }
    }

    // Validate payment and settlement methods
    if (!['fiat', 'crypto'].includes(request.payment_method)) {
      throw new Error('Invalid payment method');
    }
    if (!['bank', 'blockchain'].includes(request.settlement_method)) {
      throw new Error('Invalid settlement method');
    }
  }

  private calculateUEXBuyerFee(amount: number): number {
    const fee = amount * this.feeStructure.uex_buyer_fee_percentage;
    return Math.max(
      this.feeStructure.minimum_fee,
      Math.min(fee, this.feeStructure.maximum_fee)
    );
  }

  private calculateUEXSellerFee(amount: number): number {
    const fee = amount * this.feeStructure.uex_seller_fee_percentage;
    return Math.max(
      this.feeStructure.minimum_fee,
      Math.min(fee, this.feeStructure.maximum_fee)
    );
  }

  private calculateConversionFee(amount: number, exchangeRate: number, sourceCurrency: string, targetCurrency: string): number {
    // Only apply conversion fee when currencies are different
    if (sourceCurrency === targetCurrency) {
      return 0;
    }
    
    const fee = amount * this.feeStructure.conversion_fee_percentage;
    return Math.max(
      this.feeStructure.minimum_fee,
      Math.min(fee, this.feeStructure.maximum_fee)
    );
  }

  private calculateManagementFee(amount: number): number {
    const fee = amount * this.feeStructure.management_fee_percentage;
    return Math.max(
      this.feeStructure.minimum_fee * 0.5, // Lower minimum for management fee
      Math.min(fee, this.feeStructure.maximum_fee * 0.5)
    );
  }

  private calculateSettlementTime(paymentMethod: string, settlementMethod: string): string {
    const now = new Date();
    
    if (paymentMethod === 'fiat' && settlementMethod === 'bank') {
      // Bank transfers: 1-3 business days
      const settlementDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return settlementDate.toISOString();
    } else if (paymentMethod === 'crypto' && settlementMethod === 'blockchain') {
      // Blockchain settlements: 10-30 minutes
      const settlementDate = new Date(now.getTime() + 30 * 60 * 1000);
      return settlementDate.toISOString();
    } else if (paymentMethod === 'fiat' && settlementMethod === 'blockchain') {
      // Fiat to crypto: 1-2 hours
      const settlementDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return settlementDate.toISOString();
    } else {
      // Crypto to fiat: 1-2 business days
      const settlementDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      return settlementDate.toISOString();
    }
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentTransaction | null> {
    return await this.dbService.getPaymentTransaction(transactionId);
  }

  async updateTransactionStatus(transactionId: string, status: PaymentTransaction['status'], metadata?: any): Promise<PaymentTransaction | null> {
    const updates: Partial<PaymentTransaction> = { status };
    
    if (status === 'completed') {
      updates.completed_at = new Date();
      
      // Notify seller when transaction is completed
      try {
        await this.notifySellerOfTransactionCompletion(transactionId);
      } catch (error) {
        console.error(`Failed to notify seller for transaction ${transactionId}:`, error);
        // Don't fail the transaction update if notification fails
      }
    } else if (status === 'failed' && metadata?.failure_reason) {
      updates.failure_reason = metadata.failure_reason;
    }

    if (metadata?.transaction_hash) {
      updates.transaction_hash = metadata.transaction_hash;
    }
    if (metadata?.bank_reference) {
      updates.bank_reference = metadata.bank_reference;
    }

    return await this.dbService.updatePaymentTransaction(transactionId, updates);
  }

  private async notifySellerOfTransactionCompletion(transactionId: string): Promise<void> {
    try {
      // Get the transaction details
      const transaction = await this.dbService.getPaymentTransaction(transactionId);
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      // Determine seller notification URL based on seller_id
      let sellerNotificationUrl: string;
      switch (transaction.seller_id.toLowerCase()) {
        case 'cloud provider b':
        case 'cloud-provider-b':
          sellerNotificationUrl = 'http://localhost:3004/api/payouts/transaction-completed';
          break;
        case 'cloud provider a':
        case 'cloud-provider-a':
          // Add Cloud Provider A notification URL when available
          console.warn(`Cloud Provider A notification URL not configured yet`);
          return;
        default:
          console.warn(`No notification URL configured for seller: ${transaction.seller_id}`);
          return;
      }

      // Prepare notification payload
      const notificationPayload = {
        transaction_id: transaction.id,
        seller_id: transaction.seller_id,
        item_id: 'rtx-4090-gpu', // NVIDIA RTX 4090 GPU item ID
        item_name: 'NVIDIA RTX 4090 GPU', // Proper item name
        original_amount: transaction.amount,
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        client_id: transaction.client_id,
        order_id: `order-${transaction.id}` // Default order ID
      };

      // Send notification to seller
      const response = await axios.post(sellerNotificationUrl, notificationPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log(`✅ Successfully notified seller for transaction ${transactionId}:`, response.data);
      
    } catch (error) {
      console.error(`❌ Failed to notify seller for transaction ${transactionId}:`, error);
      throw error;
    }
  }

  async getTransactionFees(transactionId: string): Promise<ManagementTierFee[]> {
    return await this.dbService.getManagementTierFeesByTransaction(transactionId);
  }

  async getTransactionConversions(transactionId: string): Promise<CurrencyConversion[]> {
    return await this.dbService.getCurrencyConversionsByTransaction(transactionId);
  }

  async getAllTransactions(): Promise<PaymentTransaction[]> {
    return this.dbService.getAllPaymentTransactions();
  }

  // New method to notify all existing completed transactions
  async notifyAllCompletedTransactions(): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      const allTransactions = await this.getAllTransactions();
      const completedTransactions = allTransactions.filter(t => t.status === 'completed');

      console.log(`Found ${completedTransactions.length} completed transactions to notify`);

      for (const transaction of completedTransactions) {
        try {
          await this.notifySellerOfTransactionCompletion(transaction.id);
          results.success++;
          console.log(`✅ Successfully notified seller for transaction ${transaction.id}`);
        } catch (error) {
          results.failed++;
          const errorMsg = `Failed to notify for transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`📊 Notification Summary: ${results.success} successful, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('Failed to process batch notifications:', error);
      throw error;
    }
  }

  // New method to check if a transaction has been notified
  private async isTransactionNotified(transactionId: string): Promise<boolean> {
    // This is a simple implementation - in production, you'd want to track this in the database
    // For now, we'll assume all transactions need notification
    return false;
  }
} 