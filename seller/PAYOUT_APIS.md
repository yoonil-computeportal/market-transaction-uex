# Cloud Provider B - Payout APIs

This document describes the payout APIs that allow UEX to notify the seller when transactions are completed and calculate seller payouts after deducting fees.

## 🔄 Transaction Completion Flow

When a transaction is completed in the marketplace:

1. **UEX** sends a notification to the seller's payout API
2. **Seller** calculates fees (Management Tier + UEX fees)
3. **Seller** records the payout amount and creates payout records
4. **Seller** can track all payouts and statistics

## 📊 Fee Structure

- **Management Tier Fee**: 0.5% of original amount
- **UEX Fee**: 0.1% of original amount
- **Total Fees**: 0.6% of original amount
- **Seller Payout**: 99.4% of original amount (Original amount - Total fees)

### Example Fee Calculation
For a $1,599.99 transaction:
- Management Tier Fee: $8.00 (0.5%)
- UEX Fee: $1.60 (0.1%)
- Total Fees: $9.60 (0.6%)
- **Seller Payout: $1,590.39 (99.4%)**

## 🚀 API Endpoints

### 1. POST `/api/payouts/transaction-completed`
**Purpose**: Handle transaction completion notification from UEX

**Request Body**:
```json
{
  "transaction_id": "txn-001",
  "seller_id": "cloud-provider-b",
  "item_id": "rtx-4090-gpu",
  "item_name": "NVIDIA RTX 4090 GPU",
  "original_amount": 1599.99,
  "currency": "USD",
  "payment_method": "credit_card",
  "client_id": "user-1",
  "order_id": "order-001"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "notification": {
      "transaction_id": "txn-001",
      "seller_id": "cloud-provider-b",
      "item_id": "rtx-4090-gpu",
      "item_name": "NVIDIA RTX 4090 GPU",
      "original_amount": 1599.99,
      "currency": "USD",
      "payment_method": "credit_card",
      "completed_at": "2024-01-15T14:35:00Z",
      "fees": {
        "management_tier_fee": 8.00,
        "uex_fee": 1.60,
        "total_fees": 9.60
      },
      "seller_payout_amount": 1590.39,
      "client_id": "user-1",
      "order_id": "order-001"
    },
    "payout": {
      "transaction_id": "txn-001",
      "seller_id": "cloud-provider-b",
      "item_id": "rtx-4090-gpu",
      "item_name": "NVIDIA RTX 4090 GPU",
      "original_amount": 1599.99,
      "seller_payout_amount": 1590.39,
      "currency": "USD",
      "fees_breakdown": {
        "management_tier_fee": 8.00,
        "uex_fee": 1.60,
        "total_fees": 9.60
      },
      "completed_at": "2024-01-15T14:35:00Z",
      "status": "pending",
      "payout_method": "automatic",
      "payout_reference": "PAY-2024-003"
    },
    "fee_breakdown": {
      "original_amount": 1599.99,
      "management_tier_fee": 8.00,
      "uex_fee": 1.60,
      "total_fees": 9.60,
      "seller_payout_amount": 1590.39,
      "currency": "USD"
    }
  },
  "message": "Transaction txn-001 completed successfully. Seller payout: $1590.39"
}
```

### 2. POST `/api/payouts/calculate-fees`
**Purpose**: Calculate fees for a given amount

**Request Body**:
```json
{
  "amount": 1599.99,
  "currency": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "original_amount": 1599.99,
    "management_tier_fee": 8.00,
    "uex_fee": 1.60,
    "total_fees": 9.60,
    "seller_payout_amount": 1590.39,
    "currency": "USD"
  },
  "message": "Fee calculation completed successfully"
}
```

### 3. GET `/api/payouts/stats`
**Purpose**: Get payout statistics for a seller

**Query Parameters**:
- `seller_id` (optional): Seller ID (default: "cloud-provider-b")

**Response**:
```json
{
  "success": true,
  "data": {
    "total_payouts": 2620.00,
    "total_fees_paid": 347.94,
    "total_original_amount": 2967.94,
    "total_transactions": 2,
    "average_payout": 1310.00
  },
  "message": "Payout statistics retrieved successfully"
}
```

### 4. GET `/api/payouts`
**Purpose**: Get all payouts with filtering

**Query Parameters**:
- `seller_id` (optional): Filter by seller ID
- `status` (optional): Filter by payout status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

### 5. GET `/api/payouts/recent/:limit`
**Purpose**: Get recent payouts

**Path Parameters**:
- `limit`: Number of recent payouts to retrieve

### 6. GET `/api/payouts/:transaction_id`
**Purpose**: Get payout by transaction ID

### 7. GET `/api/payouts/notifications`
**Purpose**: Get transaction completion notifications

**Query Parameters**:
- `seller_id` (optional): Filter by seller ID
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

## 🔧 Integration Example

### UEX Integration
When UEX completes a transaction, it should call:

```bash
curl -X POST http://localhost:3004/api/payouts/transaction-completed \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-001",
    "seller_id": "cloud-provider-b",
    "item_id": "rtx-4090-gpu",
    "item_name": "NVIDIA RTX 4090 GPU",
    "original_amount": 1599.99,
    "currency": "USD",
    "payment_method": "credit_card",
    "client_id": "user-1",
    "order_id": "order-001"
  }'
```

### Fee Calculation
To calculate fees for any amount:

```bash
curl -X POST http://localhost:3004/api/payouts/calculate-fees \
  -H "Content-Type: application/json" \
  -d '{"amount": 1599.99, "currency": "USD"}'
```

## 📈 Payout Status Tracking

Payouts have the following statuses:
- **pending**: Payout created, awaiting processing
- **processed**: Payout processed, funds transferred
- **completed**: Payout successfully completed
- **failed**: Payout failed

## 💰 Fee Calculation Logic

```javascript
const managementTierFee = Math.max(
  (originalAmount * 0.5) / 100,  // 0.5%
  0.01  // Minimum $0.01
);

const uexFee = Math.max(
  (originalAmount * 0.1) / 100,  // 0.1%
  0.01  // Minimum $0.01
);

const totalFees = managementTierFee + uexFee;
const sellerPayoutAmount = originalAmount - totalFees;
```

## 🔐 Security Considerations

- All APIs require proper authentication in production
- Validate all input data
- Log all transaction completions for audit trails
- Implement rate limiting for API endpoints
- Use HTTPS in production environments 