exports.up = function(knex) {
  return knex.schema.createTable('currency_conversions', function(table) {
    table.string('id').primary();
    table.uuid('transaction_id').references('id').inTable('payment_transactions').onDelete('CASCADE');
    table.string('from_currency', 3).notNullable();
    table.string('to_currency', 3).notNullable();
    table.decimal('exchange_rate', 10, 6).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('converted_amount', 15, 2).notNullable();
    table.decimal('conversion_fee', 15, 2).notNullable();
    table.timestamps(true, true);
    
    table.index(['transaction_id']);
    table.index(['from_currency', 'to_currency']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('currency_conversions');
}; 