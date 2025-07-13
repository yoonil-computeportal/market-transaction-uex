exports.up = function(knex) {
  return knex.schema.createTable('exchange_rates', function(table) {
    table.string('id').primary();
    table.string('from_currency', 3).notNullable();
    table.string('to_currency', 3).notNullable();
    table.decimal('rate', 10, 6).notNullable();
    table.string('source').notNullable();
    table.timestamp('valid_until').notNullable();
    table.timestamps(true, true);
    
    table.index(['from_currency', 'to_currency']);
    table.index(['valid_until']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('exchange_rates');
}; 