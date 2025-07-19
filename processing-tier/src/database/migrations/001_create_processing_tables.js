/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('transactions', function(table) {
      table.string('id').primary();
      table.string('user_id').notNullable();
      table.text('resources').notNullable(); // JSON string
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('currency').defaultTo('USD');
      table.string('status').defaultTo('pending');
      table.string('payment_method_id');
      table.text('error_message');
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
      table.datetime('completed_at');
    })
    .createTable('resources', function(table) {
      table.string('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.string('currency').defaultTo('USD');
      table.integer('availability').defaultTo(0);
      table.integer('utilization').defaultTo(0);
      table.integer('total_capacity').defaultTo(0);
      table.integer('allocated_capacity').defaultTo(0);
      table.text('data'); // For storing JSON data
      table.string('status').defaultTo('active');
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('resource_allocations', function(table) {
      table.string('id').primary();
      table.string('resource_id').notNullable();
      table.string('user_id').notNullable();
      table.integer('quantity').notNullable();
      table.string('status').defaultTo('active');
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('resource_changes', function(table) {
      table.increments('id').primary();
      table.string('resource_id').notNullable();
      table.string('change_type').notNullable();
      table.boolean('synced').defaultTo(false);
      table.datetime('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('resource_changes')
    .dropTableIfExists('resource_allocations')
    .dropTableIfExists('resources')
    .dropTableIfExists('transactions');
}; 