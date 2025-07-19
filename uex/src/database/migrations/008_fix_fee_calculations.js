/**
 * Migration to fix incorrect fee calculations in existing transactions
 * This ensures all transactions have the correct buyer fee calculations
 */

exports.up = function(knex) {
  return knex.schema.raw(`
    UPDATE payment_transactions 
    SET 
      uex_buyer_fee = CASE 
        WHEN amount > 0 THEN MAX(0.001, MIN(amount * 0.001, 100))
        ELSE 0 
      END,
      uex_seller_fee = CASE 
        WHEN amount > 0 THEN MAX(0.001, MIN(amount * 0.001, 100))
        ELSE 0 
      END,
      management_fee = CASE 
        WHEN amount > 0 THEN MAX(0.001, MIN(amount * 0.01, 100))
        ELSE 0 
      END,
      conversion_fee = CASE 
        WHEN currency != target_currency THEN MAX(0.001, MIN(amount * 0.002, 50))
        ELSE 0 
      END,
      total_amount = amount + 
        CASE 
          WHEN amount > 0 THEN MAX(0.001, MIN(amount * 0.001, 100))
          ELSE 0 
        END + 
        (CASE 
          WHEN amount > 0 THEN MAX(0.001, MIN(amount * 0.01, 100))
          ELSE 0 
        END * 0.5) + 
        CASE 
          WHEN currency != target_currency THEN MAX(0.001, MIN(amount * 0.002, 50))
          ELSE 0 
        END
    WHERE amount > 0;
  `);
};

exports.down = function(knex) {
  // No rollback needed for this data fix
  return Promise.resolve();
}; 