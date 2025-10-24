/**
 * UEX API Service
 * Complete integration with UEX cryptocurrency exchange and payment APIs
 *
 * API Documentation: https://uex-us.stoplight.io/docs/uex
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { uexConfig } from '../config/uex-config';
import { cacheService } from './CacheService';
import {
  UEXCurrency,
  GetCurrenciesResponse,
  EstimateRequest,
  EstimateResponse,
  SwapInitiateRequest,
  SwapInitiateResponse,
  OrderStatusRequest,
  OrderStatusResponse,
  OAuth2TokenRequest,
  OAuth2TokenResponse,
  GeneratePaymentLinkRequest,
  GeneratePaymentLinkResponse,
  UEXAPIError,
  UEXConfig
} from '../types/uex';

export class UEXService {
  private swapApi: AxiosInstance;
  private merchantApi: AxiosInstance;
  private config: UEXConfig;

  constructor(configOverride?: Partial<UEXConfig>) {
    this.config = { ...uexConfig.getConfig(), ...configOverride };

    // Initialize Swap API client
    this.swapApi = axios.create({
      baseURL: this.config.swapBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Initialize Merchant API client
    this.merchantApi = axios.create({
      baseURL: this.config.merchantBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.swapApi.interceptors.request.use(
      (config) => {
        console.log(`[UEX Swap API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.swapApi.interceptors.response.use(
      (response) => response,
      (error) => this.handleAxiosError(error)
    );

    this.merchantApi.interceptors.response.use(
      (response) => response,
      (error) => this.handleAxiosError(error)
    );
  }

  // ============================================================================
  // Currency Operations
  // ============================================================================

  /**
   * Get list of supported currencies
   * GET /api/partners/get-currencies
   * Cached for 1 hour
   */
  async getCurrencies(): Promise<UEXCurrency[]> {
    try {
      // Check cache first
      const cached = cacheService.getCurrencies();
      if (cached) {
        console.log('[UEX] Using cached currencies');
        return cached;
      }

      // Fetch from API
      const response = await this.swapApi.get<GetCurrenciesResponse>(
        '/api/partners/get-currencies'
      );

      if (!response.data.success) {
        throw new UEXAPIError('Failed to fetch currencies', 'CURRENCY_FETCH_ERROR');
      }

      const currencies = response.data.data;

      // Cache the result
      cacheService.setCurrencies(currencies);

      console.log(`[UEX] Fetched ${currencies.length} currencies from API`);
      return currencies;
    } catch (error) {
      if (error instanceof UEXAPIError) throw error;
      throw new UEXAPIError(
        'Failed to get supported currencies',
        'CURRENCY_API_ERROR',
        error
      );
    }
  }

  /**
   * Get currency by code
   */
  async getCurrency(code: string): Promise<UEXCurrency | null> {
    const currencies = await this.getCurrencies();
    return currencies.find(c => c.code === code) || null;
  }

  /**
   * Check if currency is supported
   */
  async isCurrencySupported(code: string): Promise<boolean> {
    const currency = await this.getCurrency(code);
    return currency !== null;
  }

  // ============================================================================
  // Exchange Rate Operations
  // ============================================================================

  /**
   * Estimate conversion between two currencies
   * POST /api/partners/estimate
   * Cached for 5 minutes
   */
  async estimateConversion(
    fromCurrency: string,
    fromNetwork: string,
    toCurrency: string,
    toNetwork: string,
    amount: number
  ): Promise<EstimateResponse['data']> {
    try {
      // Check cache first
      const cacheKey = `${fromCurrency}:${toCurrency}`;
      const cachedRate = cacheService.getExchangeRate(cacheKey, amount.toString());

      if (cachedRate) {
        console.log(`[UEX] Using cached rate for ${cacheKey}`);
        // Return cached estimate (recalculate receive_amount)
        return {
          send_amount: amount,
          receive_amount: amount * cachedRate,
          rate: cachedRate,
          min_amount: 0,
          max_amount: 0,
          provider_fee: 0,
          network_fee: 0,
          estimated_time: '10-30 minutes'
        };
      }

      // Prepare request
      const request: EstimateRequest = {
        send: fromCurrency,
        network: fromNetwork,
        receive: toCurrency,
        receive_network: toNetwork,
        amount
      };

      // Fetch from API
      const response = await this.swapApi.post<EstimateResponse>(
        '/api/partners/estimate',
        request
      );

      if (!response.data.success) {
        throw new UEXAPIError('Failed to estimate conversion', 'ESTIMATE_ERROR');
      }

      const estimate = response.data.data;

      // Cache the rate
      cacheService.setExchangeRate(cacheKey, amount.toString(), estimate.rate);

      console.log(`[UEX] Estimated ${amount} ${fromCurrency} = ${estimate.receive_amount} ${toCurrency}`);
      return estimate;
    } catch (error) {
      if (error instanceof UEXAPIError) throw error;
      throw new UEXAPIError(
        'Failed to estimate conversion',
        'ESTIMATE_API_ERROR',
        error
      );
    }
  }

  /**
   * Get exchange rate between two currencies
   * Convenience method that returns just the rate
   */
  async getExchangeRate(
    fromCurrency: string,
    fromNetwork: string,
    toCurrency: string,
    toNetwork: string
  ): Promise<number> {
    const estimate = await this.estimateConversion(
      fromCurrency,
      fromNetwork,
      toCurrency,
      toNetwork,
      1.0 // Use 1.0 to get the base rate
    );
    return estimate.rate;
  }

  // ============================================================================
  // Swap Operations
  // ============================================================================

  /**
   * Initiate a crypto-to-crypto swap
   * POST /api/partners/swap/initiate-crypto-to-crypto
   */
  async initiateCryptoSwap(
    sendAmount: number,
    fromCurrency: string,
    fromNetwork: string,
    toCurrency: string,
    toNetwork: string,
    userWallet: string,
    receiveTag?: string,
    metadata?: Record<string, any>
  ): Promise<SwapInitiateResponse['data']> {
    try {
      // Validate referral code
      if (!this.config.referralCode) {
        throw new UEXAPIError(
          'Referral code is required but not configured',
          'MISSING_REFERRAL_CODE'
        );
      }

      // Prepare request
      const request: SwapInitiateRequest = {
        send_amount: sendAmount,
        from_currency: fromCurrency,
        base_currency_chain_id: fromNetwork,
        to_currency: toCurrency,
        quote_currency_chain_id: toNetwork,
        userWallet,
        receive_tag: receiveTag || null,
        extend: {
          ref_code: this.config.referralCode,
          ...metadata
        }
      };

      // Initiate swap
      const response = await this.swapApi.post<SwapInitiateResponse>(
        '/api/partners/swap/initiate-crypto-to-crypto',
        request
      );

      if (!response.data.success) {
        throw new UEXAPIError('Failed to initiate swap', 'SWAP_INITIATE_ERROR');
      }

      const swapData = response.data.data;

      console.log(`[UEX] Swap initiated - Order ID: ${swapData.orderId}`);
      console.log(`[UEX] Deposit address: ${swapData.deposit_address}`);

      return swapData;
    } catch (error) {
      if (error instanceof UEXAPIError) throw error;
      throw new UEXAPIError(
        'Failed to initiate crypto swap',
        'SWAP_API_ERROR',
        error
      );
    }
  }

  // ============================================================================
  // Order Status Operations
  // ============================================================================

  /**
   * Get order status
   * POST /api/partners/order-show
   * Cached for 1 minute
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse['data']> {
    try {
      // Check cache first
      const cached = cacheService.getOrderStatus(orderId);
      if (cached) {
        console.log(`[UEX] Using cached status for order ${orderId}`);
        return cached;
      }

      // Prepare request
      const request: OrderStatusRequest = {
        orderId
      };

      // Fetch from API
      const response = await this.swapApi.post<OrderStatusResponse>(
        '/api/partners/order-show',
        request
      );

      if (!response.data.success) {
        throw new UEXAPIError('Failed to get order status', 'ORDER_STATUS_ERROR');
      }

      const orderData = response.data.data;

      // Cache the result
      cacheService.setOrderStatus(orderId, orderData);

      console.log(`[UEX] Order ${orderId} status: ${orderData.external_status}`);
      return orderData;
    } catch (error) {
      if (error instanceof UEXAPIError) throw error;
      throw new UEXAPIError(
        'Failed to get order status',
        'ORDER_STATUS_API_ERROR',
        error
      );
    }
  }

  // ============================================================================
  // Merchant API Operations (requires merchant credentials)
  // ============================================================================

  /**
   * Get OAuth2 access token
   * POST /api/merchant/oauth2/token
   * Token is cached until expiration
   */
  async getOAuth2Token(): Promise<string> {
    try {
      // Check cache first
      const cachedToken = cacheService.getOAuth2Token();
      if (cachedToken) {
        console.log('[UEX] Using cached OAuth2 token');
        return cachedToken;
      }

      // Check if credentials are configured
      const credentials = uexConfig.getMerchantCredentials();
      if (!credentials) {
        throw new UEXAPIError(
          'Merchant API credentials not configured',
          'MISSING_MERCHANT_CREDENTIALS'
        );
      }

      // Prepare request
      const request: OAuth2TokenRequest = {
        client_id: credentials.clientId,
        secret_key: credentials.secretKey
      };

      // Get token from API
      const response = await this.merchantApi.post<OAuth2TokenResponse>(
        '/api/merchant/oauth2/token',
        request
      );

      if (!response.data.success) {
        throw new UEXAPIError('Failed to get OAuth2 token', 'OAUTH2_ERROR');
      }

      const tokenData = response.data.data;

      // Cache the token
      cacheService.setOAuth2Token(tokenData.access_token, tokenData.expires_in);

      console.log('[UEX] OAuth2 token obtained successfully');
      return tokenData.access_token;
    } catch (error) {
      if (error instanceof UEXAPIError) throw error;
      throw new UEXAPIError(
        'Failed to get OAuth2 token',
        'OAUTH2_API_ERROR',
        error
      );
    }
  }

  /**
   * Generate payment link for merchant checkout
   * POST /api/merchant/generate-payment-url
   * Requires OAuth2 token
   */
  async generatePaymentLink(
    request: GeneratePaymentLinkRequest
  ): Promise<GeneratePaymentLinkResponse['data']> {
    try {
      // Get OAuth2 token
      const token = await this.getOAuth2Token();

      // Generate payment link
      const response = await this.merchantApi.post<GeneratePaymentLinkResponse>(
        '/api/merchant/generate-payment-url',
        request,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new UEXAPIError('Failed to generate payment link', 'PAYMENT_LINK_ERROR');
      }

      const linkData = response.data.data;

      console.log(`[UEX] Payment link generated: ${linkData.payment_url}`);
      return linkData;
    } catch (error) {
      if (error instanceof UEXAPIError) throw error;
      throw new UEXAPIError(
        'Failed to generate payment link',
        'PAYMENT_LINK_API_ERROR',
        error
      );
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if UEX API is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.getCurrencies();
      return true;
    } catch (error) {
      console.error('[UEX] Health check failed:', error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    cacheService.flush();
    console.log('[UEX] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return cacheService.getStats();
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private handleAxiosError(error: AxiosError): never {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      throw new UEXAPIError(
        data?.error?.message || data?.message || 'UEX API request failed',
        data?.error?.code || `HTTP_${status}`,
        data?.error?.details || data
      );
    } else if (error.request) {
      // Request made but no response
      throw new UEXAPIError(
        'No response from UEX API',
        'NO_RESPONSE',
        error.message
      );
    } else {
      // Error in request setup
      throw new UEXAPIError(
        'Failed to make request to UEX API',
        'REQUEST_ERROR',
        error.message
      );
    }
  }
}

// Export singleton instance with default configuration
export const uexService = new UEXService();
