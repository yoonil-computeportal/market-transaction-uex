/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('payment_transactions', function(table) {
    table.decimal('uex_buyer_fee', 10, 4).defaultTo(0);
    table.decimal('uex_seller_fee', 10, 4).defaultTo(0);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('payment_transactions', function(table) {
    table.dropColumn('uex_buyer_fee');
    table.dropColumn('uex_seller_fee');
  });
}; 