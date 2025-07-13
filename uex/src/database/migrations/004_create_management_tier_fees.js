exports.up = function(knex) {
  return knex.schema.createTable('management_tier_fees', function(table) {
    table.string('id').primary();
    table.uuid('transaction_id').references('id').inTable('payment_transactions').onDelete('CASCADE');
    table.enum('fee_type', ['processing', 'settlement', 'currency_conversion']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.text('description').notNullable();
    table.timestamps(true, true);
    
    table.index(['transaction_id']);
    table.index(['fee_type']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('management_tier_fees');
}; 