exports.up = function(knex) {
  return knex.schema.createTable('seller_payout_accounts', function(table) {
    table.string('id').primary();
    table.string('seller_id').notNullable();
    table.enum('account_type', ['bank', 'crypto']).notNullable();
    table.json('account_details').notNullable();
    table.string('currency', 3).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['seller_id']);
    table.index(['currency']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('seller_payout_accounts');
}; 