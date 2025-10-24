# UEX API Integration Guide for Payment Processing System

## Overview

This guide explains how to integrate UEX cryptocurrency exchange and payment APIs into your existing payment processing system. Your system handles multi-currency payments with fee calculations, while UEX provides cryptocurrency exchange and payment gateway services.

---

## Architecture Overview

```
Your Payment System                    UEX Services
┌─────────────────────┐               ┌──────────────────────┐
│  PaymentController  │               │   UEX Swap API       │
│                     │               │   (uexswap.com)      │
├─────────────────────┤               ├──────────────────────┤
│ PaymentProcessing   │◄────────────► │ - Currency Lists     │
│      Service        │               │ - Exchange Rates     │
├─────────────────────┤               │ - Crypto Swaps       │
│  ExchangeRate       │               │ - Order Tracking     │
│     Service         │               └──────────────────────┘
├─────────────────────┤               
│  DatabaseService    │               ┌──────────────────────┐
└─────────────────────┘               │  UEX Merchant API    │
                                      │   (uex.us)           │
                                      ├──────────────────────┤
                                      │ - OAuth2 Auth        │
                                      │ - Payment Links      │
                                      └──────────────────────┘
```

---

## Integration Points

### 1. **ExchangeRateService Enhancement**
Replace mock exchange rates with live UEX rates

### 2. **PaymentProcessingService Enhancement**
Add UEX swap initiation for crypto payments

### 3. **New UEXService**
Dedicated service for UEX API interactions

### 4. **Webhook Handler**
Process UEX order status updates

---

## Step 1: Create UEX Service

Create a new service to handle all UEX API interactions:

```typescript
// services/UEXService.ts

import axios, { AxiosInstance } from 'axios';

interface UEXConfig {
  swapBaseUrl: string;
  merchantBaseUrl: string;
  referralCode: string;
  clientId?: string;
  secretKey?: string;
}

interface UEXCurrency {
  id: number;
  name: string;
  code: string;
  icon: string;
  slug: string;
  network: Array<{
    id: number;
    name: string;
    network: string;
    has_tag: number;
    default: number;
    contract?: string;
  }>;
}

interface UEXCardanoToken {
  ticker: string;
  tokenId: string;
  token_policy: string;
  img: string;
  is_verified: boolean;
  decimals: number;
}

interface UEXEstimateResponse {
  rate: string;
  convert: string;
  data: {
    provider: string;
    rate: string;
    min: string;
    max: string;
    convert: string;
    fee: string;
  };
}

interface UEXSwapResponse {
  success: boolean;
  data: {
    orderId: string;
    depositAddress: string;
    baseCurrencyAmount: string;
    depositTag: string | null;
    quoteCurrencyAmount: string;
    recipientAddress: string;
    baseCurrency: {
      chainName: string;
      currencyId: string;
      currencyName: string;
    };
    quoteCurrency: {
      chainName: string;
      currencyId: string;
      currencyName: string;
      receive_network: string;
    };
    provider_id: string;
    ref_code: string;
  };
}

interface UEXOrderStatus {
  data: {
    order: {
      orderId: string;
      depositAddress: string;
      baseCurrencyAmount: string;
      quoteCurrencyAmount: string;
      recipientAddress: string;
      baseCurrency: {
        chainName: string;
        currencyId: string;
        currencyName: string;
      };
      quoteCurrency: {
        chainName: string;
        currencyId: string;
        currencyName: string;
      };
      qrCode: string;
    };
    external_status: string;
  };
}

export class UEXService {
  private swapClient: AxiosInstance;
  private merchantClient: AxiosInstance;
  private config: UEXConfig;
  private cachedCurrencies: UEXCurrency[] | null = null;
  private cachedTokens: UEXCardanoToken[] | null = null;
  private cacheExpiry: Date | null = null;
  private merchantToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: UEXConfig) {
    this.config = config;
    
    this.swapClient = axios.create({
      baseURL: config.swapBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.merchantClient = axios.create({
      baseURL: config.merchantBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  // ==================== SWAP API METHODS ====================

  /**
   * Get list of supported currencies and Cardano tokens
   */
  async getSupportedCurrencies(): Promise<{ 
    currencies: UEXCurrency[], 
    cardano_tokens: UEXCardanoToken[] 
  }> {
    // Check cache
    if (this.cachedCurrencies && this.cacheExpiry && this.cacheExpiry > new Date()) {
      return {
        currencies: this.cachedCurrencies,
        cardano_tokens: this.cachedTokens || []
      };
    }

    try {
      const response = await this.swapClient.get('/api/partners/get-currencies');
      
      this.cachedCurrencies = response.data.data.currencies;
      this.cachedTokens = response.data.data.cardano_tokens;
      this.cacheExpiry = new Date(Date.now() + 60 * 60 * 1000); // Cache for 1 hour

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch UEX currencies:', error);
      throw new Error('Failed to fetch supported currencies from UEX');
    }
  }

  /**
   * Get exchange rate estimate
   */
  async estimateConversion(
    sendCurrency: string,
    sendNetwork: string,
    receiveCurrency: string,
    receiveNetwork: string,
    amount: number
  ): Promise<UEXEstimateResponse> {
    try {
      const response = await this.swapClient.post('/api/partners/estimate', {
        send: sendCurrency,
        network: sendNetwork,
        receive: receiveCurrency,
        receive_network: receiveNetwork,
        amount: amount
      });

      return response.data;
    } catch (error) {
      console.error('Failed to estimate conversion:', error);
      throw new Error(`Failed to estimate conversion from ${sendCurrency} to ${receiveCurrency}`);
    }
  }

  /**
   * Initiate crypto-to-crypto swap
   */
  async initiateCryptoToCryptoSwap(params: {
    sendAmount: number;
    fromCurrency: string;
    fromNetwork: string;
    toCurrency: string;
    toNetwork: string;
    recipientWallet: string;
    receiveTag?: string | null;
  }): Promise<UEXSwapResponse> {
    try {
      const response = await this.swapClient.post('/api/partners/swap/initiate-crypto-to-crypto', {
        send_amount: params.sendAmount,
        from_currency: params.fromCurrency,
        base_currency_chain_id: params.fromNetwork,
        to_currency: params.toCurrency,
        quote_currency_chain_id: params.toNetwork,
        userWallet: params.recipientWallet,
        receive_tag: params.receiveTag || null,
        extend: {
          ref_code: this.config.referralCode
        }
      });

      if (!response.data.success) {
        throw new Error('UEX swap initiation failed');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to initiate crypto swap:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Invalid referral code or KYC not approved');
      }
      
      throw new Error(`Failed to initiate crypto swap: ${error.message}`);
    }
  }

  /**
   * Initiate Cardano-to-Cardano swap
   */
  async initiateCardanoToCardanoSwap(params: {
    buyerAddress: string;
    recipientAddress: string;
    tokenIn: string; // Use "" for ADA
    tokenOut: string; // Use "" for ADA
    amount: number;
    slippage: number;
    availableAda: number;
    blacklistedDexes?: string[];
  }): Promise<{
    status: boolean;
    cbor: {
      status: boolean;
      cbor: string;
      txHash: string;
    };
    message: string;
  }> {
    try {
      const response = await this.swapClient.post('/api/partners/swap/initiate-cardano-to-cardano', {
        buyer_address: params.buyerAddress,
        recipient_address: params.recipientAddress,
        token_in: params.tokenIn,
        token_out: params.tokenOut,
        amount: params.amount,
        slippage: params.slippage,
        blacklisted_dexes: params.blacklistedDexes || [
          'CERRA', 'MUESLISWAP', 'GENIUS', 'SNEKFUN', 'SPECTRUM', 'AXO'
        ],
        available_user_ada: params.availableAda,
        ref_code: this.config.referralCode
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to initiate Cardano swap:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Invalid referral code or KYC not approved');
      }
      
      throw new Error(`Failed to initiate Cardano swap: ${error.message}`);
    }
  }

  /**
   * Get order status by ID
   */
  async getOrderStatus(orderId: string): Promise<UEXOrderStatus> {
    try {
      const response = await this.swapClient.post('/api/partners/order-show', {
        orderId: orderId
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to get order status for ${orderId}:`, error);
      throw new Error(`Failed to get order status: ${orderId}`);
    }
  }

  // ==================== MERCHANT API METHODS ====================

  /**
   * Get OAuth2 token for merchant operations
   */
  private async getMerchantToken(): Promise<string> {
    // Check if token is still valid
    if (this.merchantToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.merchantToken;
    }

    if (!this.config.clientId || !this.config.secretKey) {
      throw new Error('Merchant credentials not configured');
    }

    try {
      const response = await this.merchantClient.post('/api/merchant/oauth2/token', {
        client_id: this.config.clientId,
        secret_key: this.config.secretKey
      });

      this.merchantToken = response.data.data.access_token;
      // Tokens typically expire in 10 minutes, cache for 8 minutes to be safe
      this.tokenExpiry = new Date(Date.now() + 8 * 60 * 1000);

      return this.merchantToken;
    } catch (error) {
      console.error('Failed to get merchant token:', error);
      throw new Error('Failed to authenticate with UEX merchant API');
    }
  }

  /**
   * Generate payment link
   */
  async generatePaymentLink(params: {
    orderId: string;
    itemName: string;
    amount: string;
    successUrl: string;
    failureUrl: string;
  }): Promise<{ redirectUrl: string }> {
    try {
      const token = await this.getMerchantToken();

      const response = await this.merchantClient.post(
        '/api/merchant/generate-payment-url',
        {
          order: params.orderId,
          item_name: params.itemName,
          amount: params.amount,
          success_url: params.successUrl,
          failure_url: params.failureUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        redirectUrl: response.data.data.redirect_url
      };
    } catch (error) {
      console.error('Failed to generate payment link:', error);
      throw new Error('Failed to generate UEX payment link');
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Find default network for a currency
   */
  async getDefaultNetwork(currencyCode: string): Promise<string | null> {
    const { currencies } = await this.getSupportedCurrencies();
    
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return null;

    const defaultNetwork = currency.network.find(n => n.default === 1);
    return defaultNetwork ? defaultNetwork.network : currency.network[0]?.network || null;
  }

  /**
   * Validate if a currency pair is supported
   */
  async isCurrencyPairSupported(fromCurrency: string, toCurrency: string): Promise<boolean> {
    try {
      const { currencies } = await this.getSupportedCurrencies();
      
      const fromExists = currencies.some(c => c.code === fromCurrency);
      const toExists = currencies.some(c => c.code === toCurrency);

      return fromExists && toExists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Map UEX order status to your system status
   */
  mapOrderStatus(uexStatus: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
      'Awaiting Deposit': 'pending',
      'Confirming Deposit': 'processing',
      'Exchanging': 'processing',
      'Sending': 'processing',
      'Complete': 'completed',
      'Refund': 'cancelled',
      'Failed': 'failed',
      'Volatility Protection': 'pending',
      'Action Request': 'pending',
      'Request Overdue': 'failed'
    };

    return statusMap[uexStatus] || 'pending';
  }
}
```

---

## Step 2: Enhanced ExchangeRateService

Update your ExchangeRateService to use UEX rates:

```typescript
// services/ExchangeRateService.ts (Enhanced)

import { DatabaseService } from './DatabaseService';
import { UEXService } from './UEXService';
import { CurrencyPair } from '../types';

export class ExchangeRateService {
  private dbService: DatabaseService;
  private uexService: UEXService;

  // Keep mock rates as fallback
  private mockExchangeRates: Record<string, number> = {
    'USD_EUR': 0.85,
    'EUR_USD': 1.18,
    // ... your existing mock rates
  };

  constructor(dbService: DatabaseService, uexService: UEXService) {
    this.dbService = dbService;
    this.uexService = uexService;
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Check if it's the same currency
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    // First try to get from database (cache)
    const dbRate = await this.dbService.getLatestExchangeRate(fromCurrency, toCurrency);
    if (dbRate && this.isRateValid(dbRate.valid_until)) {
      return dbRate.rate;
    }

    // Try to get from UEX
    try {
      const rate = await this.getUEXExchangeRate(fromCurrency, toCurrency);
      
      // Cache the rate in database
      await this.dbService.createExchangeRate({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate: rate,
        source: 'uex_api',
        valid_until: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });
      
      return rate;
    } catch (error) {
      console.warn(`Failed to get UEX rate for ${fromCurrency}/${toCurrency}, falling back to mock rates`);
    }

    // Fallback to mock rates
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const mockRate = this.mockExchangeRates[rateKey];
    
    if (mockRate) {
      return mockRate;
    }

    // Try cross-rate calculation
    const crossRate = await this.calculateCrossRate(fromCurrency, toCurrency);
    if (crossRate) {
      return crossRate;
    }

    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }

  private async getUEXExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Get default networks for currencies
    const fromNetwork = await this.uexService.getDefaultNetwork(fromCurrency);
    const toNetwork = await this.uexService.getDefaultNetwork(toCurrency);

    if (!fromNetwork || !toNetwork) {
      throw new Error('Currency network not found');
    }

    // Use a standard amount for rate estimation (1 unit)
    const estimate = await this.uexService.estimateConversion(
      fromCurrency,
      fromNetwork,
      toCurrency,
      toNetwork,
      1.0
    );

    return parseFloat(estimate.rate);
  }

  private isRateValid(validUntil: Date): boolean {
    return new Date(validUntil) > new Date();
  }

  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const { currencies } = await this.uexService.getSupportedCurrencies();
      const currencyCodes = currencies.map(c => c.code);
      
      // Merge with your existing supported currencies
      const mockCurrencies = new Set<string>();
      for (const key of Object.keys(this.mockExchangeRates)) {
        const [from, to] = key.split('_');
        if (from) mockCurrencies.add(from);
        if (to) mockCurrencies.add(to);
      }
      
      return Array.from(new Set([...currencyCodes, ...Array.from(mockCurrencies)])).sort();
    } catch (error) {
      console.error('Failed to get UEX currencies:', error);
      // Fallback to mock currencies
      const currencies = new Set<string>();
      for (const key of Object.keys(this.mockExchangeRates)) {
        const [from, to] = key.split('_');
        if (from) currencies.add(from);
        if (to) currencies.add(to);
      }
      return Array.from(currencies).sort();
    }
  }

  async validateCurrencyPair(fromCurrency: string, toCurrency: string): Promise<boolean> {
    if (fromCurrency === toCurrency) {
      return true;
    }
    
    // Check UEX support
    try {
      const isSupported = await this.uexService.isCurrencyPairSupported(fromCurrency, toCurrency);
      if (isSupported) return true;
    } catch (error) {
      console.warn('Failed to validate pair with UEX:', error);
    }
    
    // Fallback to mock rates
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const reverseRateKey = `${toCurrency}_${fromCurrency}`;
    
    return !!(this.mockExchangeRates[rateKey] || this.mockExchangeRates[reverseRateKey]);
  }

  // Keep existing methods...
  private async calculateCrossRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    // ... existing implementation
  }

  async updateExchangeRates(): Promise<void> {
    // ... existing implementation
  }

  async getCurrencyPairs(): Promise<CurrencyPair[]> {
    // ... existing implementation
  }
}
```

---

## Step 3: Enhanced PaymentProcessingService

Update to integrate UEX swap functionality:

```typescript
// services/PaymentProcessingService.ts (Enhanced)

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { DatabaseService } from './DatabaseService';
import { ExchangeRateService } from './ExchangeRateService';
import { UEXService } from './UEXService';
import { 
  PaymentRequest, 
  PaymentResponse, 
  PaymentTransaction,
  CurrencyConversion,
  // ... other types
} from '../types';

export class PaymentProcessingService {
  private dbService: DatabaseService;
  private exchangeRateService: ExchangeRateService;
  private uexService: UEXService;

  // ... existing fee structure

  constructor(
    dbService: DatabaseService, 
    exchangeRateService: ExchangeRateService,
    uexService: UEXService
  ) {
    this.dbService = dbService;
    this.exchangeRateService = exchangeRateService;
    this.uexService = uexService;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const transactionId = uuidv4();
    
    try {
      // Step 1: Validate the payment request
      await this.validatePaymentRequest(request);

      // Step 2: Determine if this is a crypto payment requiring UEX swap
      const isCryptoPayment = this.isCryptoPayment(request);

      if (isCryptoPayment) {
        return await this.processCryptoPaymentWithUEX(request, transactionId);
      } else {
        return await this.processStandardPayment(request, transactionId);
      }

    } catch (error) {
      // Update transaction status to failed
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

  private isCryptoPayment(request: PaymentRequest): boolean {
    const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'ADA', 'BNB', 'SOL'];
    return (
      cryptoCurrencies.includes(request.currency.toUpperCase()) ||
      cryptoCurrencies.includes(request.target_currency.toUpperCase()) ||
      request.payment_method === 'crypto'
    );
  }

  private async processCryptoPaymentWithUEX(
    request: PaymentRequest, 
    transactionId: string
  ): Promise<PaymentResponse> {
    // Get exchange rate from UEX
    const exchangeRate = await this.exchangeRateService.getExchangeRate(
      request.currency, 
      request.target_currency
    );

    // Calculate fees (your existing fee logic)
    const uexBuyerFee = this.calculateUEXBuyerFee(request.amount);
    const uexSellerFee = this.calculateUEXSellerFee(request.amount);
    const conversionFee = this.calculateConversionFee(
      request.amount, 
      exchangeRate, 
      request.currency, 
      request.target_currency
    );
    
    const totalManagementFee = this.calculateManagementFee(request.amount);
    const managementBuyerFee = totalManagementFee * 0.5;
    const managementSellerFee = totalManagementFee * 0.5;
    
    const totalBuyerFees = uexBuyerFee + managementBuyerFee + conversionFee;
    const totalSellerFees = uexSellerFee + managementSellerFee;
    const totalAmount = request.amount + totalBuyerFees;

    // Create payment transaction in your database
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
      management_fee: totalManagementFee,
      total_amount: totalAmount,
      status: 'pending',
      payment_method: request.payment_method,
      settlement_method: request.settlement_method
    };

    await this.dbService.createPaymentTransactionWithId(transaction, transactionId);

    // Initiate UEX swap
    try {
      const swapResult = await this.initiateUEXSwap(request, transactionId);
      
      // Update transaction with UEX order ID and deposit address
      await this.dbService.updatePaymentTransaction(transactionId, {
        uex_order_id: swapResult.orderId,
        deposit_address: swapResult.depositAddress,
        status: 'processing'
      });

      // Create currency conversion record
      if (request.currency !== request.target_currency) {
        const conversion: Omit<CurrencyConversion, 'id' | 'created_at'> = {
          transaction_id: transactionId,
          from_currency: request.currency,
          to_currency: request.target_currency,
          exchange_rate: exchangeRate,
          amount: request.amount,
          converted_amount: request.amount * exchangeRate,
          conversion_fee: 0
        };
        await this.dbService.createCurrencyConversion(conversion);
      }

      const response: PaymentResponse = {
        transaction_id: transactionId,
        status: 'processing',
        amount: request.amount,
        currency: request.currency,
        target_currency: request.target_currency,
        conversion_rate: exchangeRate,
        fees: {
          uex_buyer_fee: uexBuyerFee,
          uex_seller_fee: uexSellerFee,
          conversion_fee: conversionFee,
          management_fee: totalManagementFee,
          total_fee: totalBuyerFees
        },
        total_amount: totalAmount,
        estimated_settlement_time: this.calculateSettlementTime(
          request.payment_method,
          request.settlement_method
        ),
        created_at: new Date(),
        uex_data: {
          order_id: swapResult.orderId,
          deposit_address: swapResult.depositAddress,
          deposit_tag: swapResult.depositTag,
          qr_code: swapResult.qrCode
        }
      };

      return response;

    } catch (error) {
      console.error('Failed to initiate UEX swap:', error);
      throw new Error(`UEX swap initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async initiateUEXSwap(
    request: PaymentRequest, 
    transactionId: string
  ): Promise<{
    orderId: string;
    depositAddress: string;
    depositTag: string | null;
    qrCode?: string;
  }> {
    // Get default networks
    const fromNetwork = await this.uexService.getDefaultNetwork(request.currency);
    const toNetwork = await this.uexService.getDefaultNetwork(request.target_currency);

    if (!fromNetwork || !toNetwork) {
      throw new Error('Unable to determine currency networks');
    }

    // Get recipient wallet from request metadata or generate one
    const recipientWallet = request.metadata?.recipient_wallet || 
                           await this.getOrCreateWallet(request.seller_id, request.target_currency);

    // Initiate swap
    const swapResponse = await this.uexService.initiateCryptoToCryptoSwap({
      sendAmount: request.amount,
      fromCurrency: request.currency,
      fromNetwork: fromNetwork,
      toCurrency: request.target_currency,
      toNetwork: toNetwork,
      recipientWallet: recipientWallet,
      receiveTag: null
    });

    // Generate QR code URL for deposit address
    const qrCode = `https://quickchart.io/qr?chs=256x256&text=${swapResponse.data.depositAddress}`;

    return {
      orderId: swapResponse.data.orderId,
      depositAddress: swapResponse.data.depositAddress,
      depositTag: swapResponse.data.depositTag,
      qrCode: qrCode
    };
  }

  private async getOrCreateWallet(sellerId: string, currency: string): Promise<string> {
    // TODO: Implement wallet management
    // For now, return a placeholder - in production, manage seller wallets
    throw new Error('Seller wallet management not implemented');
  }

  private async processStandardPayment(
    request: PaymentRequest, 
    transactionId: string
  ): Promise<PaymentResponse> {
    // Your existing processPayment logic for non-crypto payments
    // ... (existing code)
  }

  // Keep all existing methods: calculateUEXBuyerFee, calculateUEXSellerFee, etc.
  // ... existing methods
}
```

---

Continued in next message...
