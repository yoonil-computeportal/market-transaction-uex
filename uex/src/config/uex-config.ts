/**
 * UEX API Configuration
 * Loads configuration from environment variables
 */

import { UEXConfig } from '../types/uex';

export class UEXConfigManager {
  private static instance: UEXConfigManager;
  private config: UEXConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): UEXConfigManager {
    if (!UEXConfigManager.instance) {
      UEXConfigManager.instance = new UEXConfigManager();
    }
    return UEXConfigManager.instance;
  }

  private loadConfig(): UEXConfig {
    return {
      swapBaseUrl: process.env.UEX_SWAP_BASE_URL || 'https://uexswap.com',
      merchantBaseUrl: process.env.UEX_MERCHANT_BASE_URL || 'https://uex.us',
      referralCode: process.env.UEX_REFERRAL_CODE || '',
      clientId: process.env.UEX_CLIENT_ID,
      secretKey: process.env.UEX_SECRET_KEY
    };
  }

  private validateConfig(): void {
    if (!this.config.referralCode) {
      console.warn('⚠️  UEX_REFERRAL_CODE is not set. UEX integration will not work properly.');
      console.warn('   Get your referral code at: https://uex.us/referrals');
    }

    if (!this.config.clientId || !this.config.secretKey) {
      console.warn('⚠️  UEX Merchant API credentials not set (UEX_CLIENT_ID, UEX_SECRET_KEY).');
      console.warn('   Payment link generation will not be available.');
      console.warn('   Apply for merchant access at: https://uex.us/');
    }
  }

  public getConfig(): UEXConfig {
    return { ...this.config };
  }

  public getSwapBaseUrl(): string {
    return this.config.swapBaseUrl;
  }

  public getMerchantBaseUrl(): string {
    return this.config.merchantBaseUrl;
  }

  public getReferralCode(): string {
    return this.config.referralCode;
  }

  public hasMerchantCredentials(): boolean {
    return !!(this.config.clientId && this.config.secretKey);
  }

  public getMerchantCredentials(): { clientId: string; secretKey: string } | null {
    if (!this.hasMerchantCredentials()) {
      return null;
    }
    return {
      clientId: this.config.clientId!,
      secretKey: this.config.secretKey!
    };
  }

  // Update configuration at runtime (useful for testing)
  public updateConfig(updates: Partial<UEXConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }
}

// Export singleton instance
export const uexConfig = UEXConfigManager.getInstance();
