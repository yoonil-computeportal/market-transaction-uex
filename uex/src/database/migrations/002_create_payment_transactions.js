exports.up = function(knex) {
  return knex.schema.createTable('payment_transactions', function(table) {
    table.string('id').primary();
    table.string('client_id').notNullable();
    table.string('seller_id').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.string('target_currency', 3).notNullable();
    table.decimal('conversion_rate', 10, 6);
    table.decimal('conversion_fee', 15, 2);
    table.decimal('management_fee', 15, 2);
    table.decimal('total_amount', 15, 2).notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.enum('payment_method', ['fiat', 'crypto']).notNullable();
    table.enum('settlement_method', ['bank', 'blockchain']).notNullable();
    table.timestamps(true, true);
    table.timestamp('completed_at');
    table.text('failure_reason');
    table.string('transaction_hash');
    table.string('bank_reference');
    
    table.index(['client_id']);
    table.index(['seller_id']);
    table.index(['status']);
    table.index(['payment_method']);
    table.index(['settlement_method']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_transactions');
}; 