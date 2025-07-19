/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('clusters', function(table) {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('endpoint').notNullable();
      table.string('region');
      table.string('status').defaultTo('active');
      table.datetime('last_heartbeat');
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('state_changes', function(table) {
      table.increments('id').primary();
      table.string('key').notNullable();
      table.text('data');
      table.boolean('synced').defaultTo(false);
      table.datetime('created_at').defaultTo(knex.fn.now());
    })
    .createTable('global_state', function(table) {
      table.string('key').primary();
      table.text('data');
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('global_state')
    .dropTableIfExists('state_changes')
    .dropTableIfExists('clusters');
}; 