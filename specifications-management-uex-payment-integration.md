# Management Tier ↔ UEX Payment Processing Integration Specification

This document specifies the API interface between the Management Tier of the ComputePortal Marketplace Transaction Engine and the UEX Payment Processing Backend.

---

## Base URL

```
https://api.uex-payments.com/v1
```

---

## Authentication

All requests must include the following headers:
```
Authorization: Bearer <UEX_API_KEY>
Content-Type: application/json
X-Request-ID: <unique_request_id>
```

---

## 1. Payment Processing

### 1.1 Create Payment Intent
- **Endpoint:** `/payments/intent`
- **Method:** `POST`
- **Description:** Create a payment intent for a transaction.
- **Payload:**
  ```json
  {
    "amount": number, // Amount in cents
    "currency": "string", // ISO 4217 currency code (e.g., "USD")
    "transaction_id": "string", // Internal transaction ID
    "order_id": "string", // Internal order ID
    "customer": {
      "id": "string",
      "email": "string",
      "name": "string"
    },
    "metadata": {
      "marketplace_fee": number,
      "seller_id": "string",
      "resource_type": "string"
    },
    "webhook_url": "string" // URL for payment status updates
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "payment_intent_id": "string",
    "client_secret": "string",
    "status": "requires_payment_method",
    "amount": number,
    "currency": "string",
    "created_at": "ISO8601 string"
  }
  ```

### 1.2 Confirm Payment
- **Endpoint:** `/payments/confirm`
- **Method:** `POST`
- **Description:** Confirm a payment with payment method details.
- **Payload:**
  ```json
  {
    "payment_intent_id": "string",
    "payment_method": {
      "type": "card",
      "card": {
        "number": "string",
        "exp_month": number,
        "exp_year": number,
        "cvc": "string"
      }
    },
    "return_url": "string" // URL to redirect after payment
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "payment_id": "string",
    "status": "succeeded",
    "amount": number,
    "currency": "string",
    "fee_amount": number,
    "settlement_amount": number,
    "processed_at": "ISO8601 string"
  }
  ```

---

## 2. Payment Status & Webhooks

### 2.1 Get Payment Status
- **Endpoint:** `/payments/{payment_id}`
- **Method:** `GET`
- **Description:** Retrieve payment status and details.
- **Response:**
  ```json
  {
    "success": true,
    "payment_id": "string",
    "payment_intent_id": "string",
    "status": "succeeded|failed|pending|cancelled",
    "amount": number,
    "currency": "string",
    "fee_amount": number,
    "settlement_amount": number,
    "customer": {
      "id": "string",
      "email": "string",
      "name": "string"
    },
    "metadata": { ... },
    "created_at": "ISO8601 string",
    "processed_at": "ISO8601 string"
  }
  ```

### 2.2 Payment Webhook
- **Endpoint:** `POST` to Management Tier webhook URL
- **Description:** UEX sends payment status updates to management tier.
- **Payload:**
  ```json
  {
    "event": "payment.succeeded|payment.failed|payment.pending",
    "payment_id": "string",
    "payment_intent_id": "string",
    "transaction_id": "string",
    "order_id": "string",
    "status": "string",
    "amount": number,
    "currency": "string",
    "fee_amount": number,
    "settlement_amount": number,
    "timestamp": "ISO8601 string",
    "signature": "string" // HMAC signature for verification
  }
  ```

---

## 3. Settlement & Payout

### 3.1 Create Settlement
- **Endpoint:** `/settlements`
- **Method:** `POST`
- **Description:** Create a settlement for a seller.
- **Payload:**
  ```json
  {
    "seller_id": "string",
    "amount": number,
    "currency": "string",
    "payment_ids": ["string"], // Array of payment IDs to settle
    "bank_account": {
      "account_number": "string",
      "routing_number": "string",
      "account_type": "checking|savings"
    },
    "metadata": {
      "settlement_period": "string",
      "transaction_count": number
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "settlement_id": "string",
    "status": "pending",
    "amount": number,
    "currency": "string",
    "fee_amount": number,
    "net_amount": number,
    "estimated_arrival": "ISO8601 string",
    "created_at": "ISO8601 string"
  }
  ```

### 3.2 Get Settlement Status
- **Endpoint:** `/settlements/{settlement_id}`
- **Method:** `GET`
- **Description:** Retrieve settlement status and details.
- **Response:**
  ```json
  {
    "success": true,
    "settlement_id": "string",
    "status": "pending|processing|completed|failed",
    "amount": number,
    "currency": "string",
    "fee_amount": number,
    "net_amount": number,
    "bank_account": { ... },
    "created_at": "ISO8601 string",
    "completed_at": "ISO8601 string"
  }
  ```

---

## 4. Refunds & Disputes

### 4.1 Create Refund
- **Endpoint:** `/refunds`
- **Method:** `POST`
- **Description:** Create a refund for a payment.
- **Payload:**
  ```json
  {
    "payment_id": "string",
    "amount": number, // Partial refund amount (optional, defaults to full amount)
    "reason": "string", // Refund reason
    "metadata": {
      "refund_type": "full|partial",
      "admin_notes": "string"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "refund_id": "string",
    "payment_id": "string",
    "status": "pending",
    "amount": number,
    "currency": "string",
    "reason": "string",
    "created_at": "ISO8601 string"
  }
  ```

### 4.2 Get Refund Status
- **Endpoint:** `/refunds/{refund_id}`
- **Method:** `GET`
- **Description:** Retrieve refund status and details.
- **Response:**
  ```json
  {
    "success": true,
    "refund_id": "string",
    "payment_id": "string",
    "status": "pending|succeeded|failed",
    "amount": number,
    "currency": "string",
    "reason": "string",
    "created_at": "ISO8601 string",
    "processed_at": "ISO8601 string"
  }
  ```

---

## 5. Reporting & Analytics

### 5.1 Get Transaction Report
- **Endpoint:** `/reports/transactions`
- **Method:** `GET`
- **Description:** Retrieve transaction report for a date range.
- **Query Parameters:**
  ```
  start_date: ISO8601 string
  end_date: ISO8601 string
  status: string (optional)
  limit: number (optional, default: 100)
  offset: number (optional, default: 0)
  ```
- **Response:**
  ```json
  {
    "success": true,
    "transactions": [
      {
        "payment_id": "string",
        "transaction_id": "string",
        "order_id": "string",
        "status": "string",
        "amount": number,
        "currency": "string",
        "fee_amount": number,
        "settlement_amount": number,
        "customer": { ... },
        "created_at": "ISO8601 string",
        "processed_at": "ISO8601 string"
      }
    ],
    "pagination": {
      "total": number,
      "limit": number,
      "offset": number,
      "has_more": boolean
    }
  }
  ```

### 5.2 Get Settlement Report
- **Endpoint:** `/reports/settlements`
- **Method:** `GET`
- **Description:** Retrieve settlement report for a date range.
- **Query Parameters:**
  ```
  start_date: ISO8601 string
  end_date: ISO8601 string
  status: string (optional)
  seller_id: string (optional)
  ```
- **Response:**
  ```json
  {
    "success": true,
    "settlements": [
      {
        "settlement_id": "string",
        "seller_id": "string",
        "status": "string",
        "amount": number,
        "currency": "string",
        "fee_amount": number,
        "net_amount": number,
        "transaction_count": number,
        "created_at": "ISO8601 string",
        "completed_at": "ISO8601 string"
      }
    ]
  }
  ```

---

## 6. Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": { ... }
  }
}
```

### Common Error Codes
- `invalid_request`: Invalid request parameters
- `authentication_failed`: Invalid API key
- `payment_failed`: Payment processing failed
- `insufficient_funds`: Insufficient funds for settlement
- `invalid_payment_method`: Invalid payment method
- `rate_limit_exceeded`: Too many requests
- `server_error`: UEX server error

---

## 7. Security Requirements

### 7.1 Webhook Verification
- All webhook payloads must be verified using HMAC-SHA256
- Signature header: `X-UEX-Signature`
- Secret key provided by UEX during onboarding

### 7.2 PCI Compliance
- All card data must be handled according to PCI DSS standards
- Card numbers should never be stored in plain text
- Use UEX's secure payment method tokens when possible

### 7.3 Rate Limiting
- Maximum 100 requests per minute per API key
- Rate limit headers included in responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1640995200
  ```

---

## 8. Testing

### 8.1 Test Environment
- Base URL: `https://api-test.uex-payments.com/v1`
- Test API keys provided by UEX
- Test webhook endpoint: `https://webhook.site/your-test-url`

### 8.2 Test Cards
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Insufficient funds: `4000000000009995`

---

## Notes
- All amounts are in cents (smallest currency unit)
- All timestamps are in ISO8601 format
- All IDs are strings (UUID format)
- Webhook retries: UEX will retry failed webhooks up to 3 times with exponential backoff
- Settlement processing time: 1-3 business days
- Refund processing time: 3-10 business days 