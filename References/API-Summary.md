  UEX API Reference Documentation Summary

  Overview:

  The References directory contains comprehensive API documentation for integrating with the UEX (Universal Exchange) cryptocurrency platform. UEX provides crypto-to-crypto and Cardano token swap
  services with referral rewards programs.

  Key Files:

  1. api-docs.json - Complete OpenAPI 3.0 specification with all endpoints
  2. uex-api.txt - Overview and introduction to UEX API v1.0
  3. crypto2crypto.txt - Crypto-to-crypto swap endpoint documentation
  4. cardano2cardano.txt - Cardano-to-Cardano swap endpoint documentation
  5. Order-info-by-ID.txt - Order status tracking endpoint
  6. Returns.txt - Get supported currencies and tokens endpoint
  7. Estimate-conversion-amount.txt - Conversion estimation endpoint
  8. Get-auth2-token.txt - OAuth2 authentication endpoint
  9. Сreate-payment-link.txt - Payment link generation endpoint

  Main API Endpoints:

  1. Swap Operations (uexswap.com)

  Crypto-to-Crypto Swap:
  - Endpoint: POST https://uexswap.com/api/partners/swap/initiate-crypto-to-crypto
  - Purpose: Initiate cryptocurrency swaps (BTC → USDT, ETH → ADA, etc.)
  - Requires: Referral code (ref_code)
  - Returns: Order ID, deposit address, amounts, transaction details

  Cardano-to-Cardano Swap:
  - Endpoint: POST https://uexswap.com/api/partners/swap/initiate-cardano-to-cardano
  - Purpose: Swap Cardano tokens or ADA
  - Returns: CBOR-encoded unsigned transaction for wallet signing
  - Special: Includes slippage protection and DEX blacklist

  2. Order Management

  Get Order Info:
  - Endpoint: POST https://uexswap.com/api/partners/order-show
  - Purpose: Track swap order status by ID
  - Status Types: Awaiting Deposit, Confirming, Exchanging, Sending, Complete, Failed, Refund, etc.

  Get Currencies:
  - Endpoint: GET https://uexswap.com/api/partners/get-currencies
  - Returns: List of supported cryptocurrencies and Cardano tokens with network details

  Estimate Conversion:
  - Endpoint: POST https://uexswap.com/api/partners/estimate
  - Purpose: Calculate exchange rates and amounts before swapping
  - Supports: Crypto-to-Crypto, Crypto-to-Cardano, Cardano-to-Crypto, Cardano-to-Cardano

  3. Merchant Operations (uex.us)

  Get OAuth2 Token:
  - Endpoint: POST https://uex.us/api/merchant/oauth2/token
  - Requires: client_id, secret_key
  - Returns: Bearer access token for merchant API calls

  Create Payment Link:
  - Endpoint: POST https://uex.us/api/merchant/generate-payment-url
  - Requires: OAuth2 token in Authorization header
  - Purpose: Generate payment URLs for merchant checkout
  - Returns: Redirect URL to UEX payment page

  Key Features:

  Referral Program:
  - Must complete KYC verification
  - Generate referral code at https://uex.us/referrals
  - Earn 0.19% commission on crypto swaps
  - Earn 0.5 ADA fixed reward per Cardano-to-Cardano swap
  - Referral code must be included in API requests

  Authentication:
  - Swap APIs: Require referral code (ref_code)
  - Merchant APIs: Require OAuth2 Bearer token
  - KYC approval required for full functionality

  Rate Limiting:
  - No strict limits specified
  - Implement exponential backoff for HTTP 429 responses

  Integration Notes:

  The MarketPlace Transaction Engine integrates with UEX to provide multi-currency payment processing including:
  - Cross-cryptocurrency conversions
  - Cardano blockchain native token swaps
  - Payment link generation for merchant checkouts
  - Real-time order status tracking
  - Fee calculation and conversion estimation

  All these endpoints are documented and ready for integration with your marketplace platform!