# Database Migrations

This directory contains database migration scripts for the UEX Payment Processing System.

## Migrations

| # | Name | Description | Status |
|---|------|-------------|--------|
| 003 | add_uex_fields.sql | Add UEX integration fields and tables | ✅ Ready |

## Running Migrations

### SQLite (Development)

```bash
# Run migration
sqlite3 dev.db < migrations/003_add_uex_fields.sql

# Verify migration
sqlite3 dev.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%uex%';"
```

### PostgreSQL (Production)

```bash
# Run migration
psql -d uex_payments -f migrations/003_add_uex_fields.sql

# Verify migration
psql -d uex_payments -c "\d payment_transactions"
psql -d uex_payments -c "\d uex_order_tracking"
psql -d uex_payments -c "\d referral_earnings"
psql -d uex_payments -c "\d webhook_events"
```

## Migration 003 Details

### New Columns in `payment_transactions`

- `uex_order_id` - UEX swap order identifier
- `uex_deposit_address` - Crypto address for customer deposits
- `deposit_tag` - Memo/tag for deposits (XRP, XLM, etc.)
- `qr_code_url` - QR code image URL
- `uex_status` - Current UEX order status
- `uex_raw_response` - Full UEX API response (JSON)
- `uex_webhook_data` - Webhook payload data (JSON)
- `last_webhook_at` - Last webhook received timestamp
- `last_poll_at` - Last polling check timestamp

### New Tables

#### `uex_order_tracking`
Detailed tracking for UEX swap orders with full order lifecycle history.

#### `referral_earnings`
Tracks referral commissions earned from UEX (0.19% + 0.5 ADA per Cardano swap).

#### `webhook_events`
Logs all incoming webhook events for debugging and analytics.

### Indexes Created

- Optimized for polling queries (pending transactions with UEX orders)
- Fast lookups by UEX order ID
- Efficient status and timestamp filtering
- Webhook event tracking and analysis

## Rollback

To rollback migration 003, run the rollback commands at the bottom of the migration file:

```bash
# SQLite
sqlite3 dev.db < migrations/003_rollback.sql

# PostgreSQL
psql -d uex_payments -f migrations/003_rollback.sql
```

## Best Practices

1. **Backup First**: Always backup your database before running migrations
2. **Test in Dev**: Test migrations in development environment first
3. **Review Changes**: Review the SQL before executing
4. **Monitor Performance**: Check query performance after adding indexes
5. **Document Changes**: Update this README when adding new migrations

## Next Steps

After running the migration:

1. Update your ORM/database layer to include new fields
2. Test UEX integration with real database
3. Verify indexes are being used (EXPLAIN QUERY PLAN)
4. Monitor webhook event logs for debugging
